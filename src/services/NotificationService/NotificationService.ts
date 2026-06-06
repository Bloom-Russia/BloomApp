import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  SecureStorageKeys,
  SecureStorageResult,
  SecureStorageService,
} from '../SecureStorageService';
import {
  AndroidNotificationConfig,
  ExtendedNotification,
  IOSNotificationData,
  NotifeeNotificationDetail,
  NotificationHandler,
  NotificationPayload,
} from './types';

class NotificationService {
  private static instance: NotificationService;
  private static notificationHandlers: NotificationHandler[] = [];
  private initialNotification: FirebaseMessagingTypes.RemoteMessage | null = null;
  private readonly nativeEventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;
  private isProcessingForeground = new Set<string>();
  private lastNotificationTime = new Map<string, number>();

  // Кэш для обработанных событий Notifee
  private processedNotifeeEvents = new Map<string, number>();
  private readonly NOTIFEE_DEBOUNCE_MS = 3000;

  private constructor() {
    // Инициализируем NativeEventEmitter для iOS
    if (Platform.OS === 'ios' && NativeModules.RCTDeviceEventEmitter) {
      this.nativeEventEmitter = new NativeEventEmitter(NativeModules.RCTDeviceEventEmitter);
    }
  }

  /**
   * Получение экземпляра сервиса (Singleton)
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Статический метод для уведомления всех подписчиков
   */
  static notifySubscribers(notification: NotificationPayload): void {
    const handlers = [...NotificationService.notificationHandlers];
    handlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Ошибка в обработчике уведомлений:', error);
      }
    });
  }

  /**
   * Проверка дедупликации для событий Notifee
   */
  private shouldProcessNotifeeEvent(
    eventType: string,
    notificationId: string | null | undefined,
  ): boolean {
    // Если нет ID, используем временную метку
    const finalNotificationId = notificationId || `${eventType}_${Date.now()}`;
    const eventKey = `${eventType}_${finalNotificationId}`;
    const lastProcessed = this.processedNotifeeEvents.get(eventKey);
    const currentTime = Date.now();

    if (lastProcessed && currentTime - lastProcessed < this.NOTIFEE_DEBOUNCE_MS) {
      console.log(
        `⏭️ [Notifee] Пропускаем дублирующее событие ${eventType} для ${finalNotificationId}, прошло ${
          currentTime - lastProcessed
        }ms`,
      );
      return false;
    }

    this.processedNotifeeEvents.set(eventKey, currentTime);

    // Очищаем старые записи
    setTimeout(() => {
      this.processedNotifeeEvents.delete(eventKey);
    }, this.NOTIFEE_DEBOUNCE_MS);

    // Очищаем кэш, если он слишком большой
    if (this.processedNotifeeEvents.size > 100) {
      const oldestKey = Array.from(this.processedNotifeeEvents.keys())[0];
      if (oldestKey) {
        this.processedNotifeeEvents.delete(oldestKey);
      }
    }

    return true;
  }

  /**
   * Инициализация сервиса уведомлений
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`[${Platform.OS}] Сервис уведомлений уже инициализирован`);
      return;
    }

    try {
      console.log(`[${Platform.OS}] Инициализация сервиса уведомлений...`);

      // Инициализируем Notifee
      await this.initializeNotifee();

      // Запрашиваем разрешения
      const hasPermission = await this.requestPermission();

      if (hasPermission) {
        // Получаем и обновляем FCM токен
        await this.getFCMToken();

        // Подписываемся на обновления токена (важно для iOS)
        this.setupTokenRefresh();
      }

      // Настраиваем обработчики сообщений
      this.setupMessageHandlers();

      // Проверяем, было ли приложение открыто по тапу на уведомление
      await this.checkInitialNotification();

      this.isInitialized = true;
      console.log(`[${Platform.OS}] Сервис уведомлений успешно инициализирован`);
    } catch (error) {
      console.error(`[${Platform.OS}] Ошибка при инициализации сервиса уведомлений:`, error);
      throw error;
    }
  }

  /**
   * Инициализация Notifee с улучшенной дедупликацией
   */
  private async initializeNotifee(): Promise<void> {
    // Создаем канал для уведомлений (Android)
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      });

      await notifee.createChannel({
        id: 'verification',
        name: 'Verification Channel',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      });

      await notifee.createChannel({
        id: 'silent',
        name: 'Silent Channel',
        importance: AndroidImportance.LOW,
      });
    }

    // Настройка обработчика нажатий на уведомления С ДЕДУПЛИКАЦИЕЙ
    notifee.onForegroundEvent(({ type, detail }) => {
      // Получаем notificationId из разных возможных источников
      let notificationId: string | null | undefined = detail.notification?.id;

      if (!notificationId && detail.notification?.data) {
        const data = detail.notification.data;
        notificationId =
          typeof data.notificationId === 'string'
            ? data.notificationId
            : typeof data.uniqueId === 'string'
            ? data.uniqueId
            : undefined;
      }

      switch (type) {
        case EventType.PRESS:
          // Дедупликация для нажатий
          if (this.shouldProcessNotifeeEvent('PRESS', notificationId)) {
            console.log('[Notifee] Уведомление нажато:', detail.notification);
            this.handleNotificationPress(detail.notification);
          }
          break;

        case EventType.ACTION_PRESS:
          // Дедупликация для действий
          if (this.shouldProcessNotifeeEvent('ACTION_PRESS', notificationId)) {
            console.log('[Notifee] Нажата кнопка действия:', detail.pressAction);
            if (detail.pressAction) {
              this.handleNotificationAction(detail.pressAction);
            }
          }
          break;

        case EventType.DISMISSED:
          // Дедупликация для событий закрытия
          if (this.shouldProcessNotifeeEvent('DISMISSED', notificationId)) {
            console.log('[Notifee] Уведомление отклонено, ID:', notificationId);
            this.handleNotificationDismiss(detail.notification);
          } else {
            console.log('[Notifee] Пропущен дублирующий DISMISS для:', notificationId);
          }
          break;
      }
    });
  }

  /**
   * Обработка закрытия уведомления
   */
  private handleNotificationDismiss(notification: unknown): void {
    const notifeeNotification = notification as NotifeeNotificationDetail['notification'];
    const data = notifeeNotification?.data;

    if (data) {
      const notificationId = data.notificationId;

      console.log(`📱 [DISMISS] Уведомление закрыто: ${notificationId}`);

      // Создаем payload для подписчиков
      const payload: NotificationPayload = {
        title: notifeeNotification?.title || '',
        body: notifeeNotification?.body || '',
        data: data,
        messageId: notificationId || Date.now().toString(),
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
        isForeground: true,
        eventType: 'dismissed',
      };

      // Уведомляем подписчиков о закрытии (если нужно)
      this.notifyHandlersFromInstance(payload);
    }
  }

  /**
   * Обработка нажатия на уведомление
   */
  private handleNotificationPress(notification: unknown): void {
    const notifeeNotification = notification as NotifeeNotificationDetail['notification'];
    const data = notifeeNotification?.data;
    if (data) {
      const payload: NotificationPayload = {
        title: notifeeNotification?.title || '',
        body: notifeeNotification?.body || '',
        data: data,
        messageId: data.messageId,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
        isForeground: false,
        eventType: 'press',
      };
      this.notifyHandlersFromInstance(payload);
    }
  }

  /**
   * Обработка нажатия на кнопку действия
   */
  private handleNotificationAction(action: { id: string }): void {
    console.log('[Notifee] Действие:', action);
    // TODO: Обработка действий (например, ответить, прочитать и т.д.)
  }

  /**
   * Показ локального уведомления с уникальным ID
   */
  private async showLocalNotification(
    notification: NotificationPayload,
    _isForeground: boolean = true,
  ): Promise<void> {
    try {
      // Не показываем silent уведомления
      if (notification.isSilent) {
        console.log('[NotificationService] Silent уведомление, не показываем');
        return;
      }

      // Не показываем уведомления без заголовка и тела
      if (!notification.title && !notification.body) {
        console.log('[NotificationService] Уведомление без заголовка и тела, не показываем');
        return;
      }

      // Определяем канал в зависимости от типа
      let channelId = 'default';
      if (notification.data?.type === 'verification') {
        channelId = 'verification';
      } else if (notification.isSilent) {
        channelId = 'silent';
      }

      // Используем СТАБИЛЬНЫЙ ID уведомления на основе данных
      let stableNotificationId =
        typeof notification.data?.notificationId === 'string'
          ? notification.data.notificationId
          : typeof notification.data?.uniqueId === 'string'
          ? notification.data.uniqueId
          : undefined;

      if (!stableNotificationId) {
        // Создаем стабильный ID на основе содержимого
        const contentHash = `${notification.type || 'default'}_${notification.title || ''}_${
          notification.data?.code || ''
        }`;
        stableNotificationId = this.hashString(contentHash);
      }

      console.log(`[Notifee] Показ уведомления с ID: ${stableNotificationId}`);

      // Подготовка iOS конфигурации
      const iosConfig: {
        sound: string;
        badgeCount?: number;
      } = {
        sound: notification.sound || 'default',
      };

      // Проверяем badge: должен быть числом и >= 0
      if (
        typeof notification.badge === 'number' &&
        notification.badge >= 0 &&
        !isNaN(notification.badge)
      ) {
        iosConfig.badgeCount = notification.badge;
      }

      // Настройка для Android
      const androidConfig: AndroidNotificationConfig | undefined =
        Platform.OS === 'android'
          ? {
              channelId,
              pressAction: { id: 'default' },
              importance: AndroidImportance.HIGH,
              autoCancel: true,
              tag: notification.data?.type || 'default',
              ...(notification.data?.image && {
                style: 'bigpicture',
                picture: notification.data.image,
              }),
            }
          : undefined;

      // Показываем уведомление со СТАБИЛЬНЫМ ID
      await notifee.displayNotification({
        id: stableNotificationId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: androidConfig as never,
        ios: Platform.OS === 'ios' ? iosConfig : undefined,
      });

      console.log(
        `[Notifee] Уведомление показано: ${notification.title} (ID: ${stableNotificationId})`,
      );
    } catch (error) {
      console.error('[NotificationService] Ошибка показа уведомления:', error);
    }
  }

  /**
   * Вспомогательный метод для хеширования строки
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash - (hash << 5) + char) & 0xffffffff; // Convert to 32-bit integer using bitwise AND
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Обновление бейджа на иконке приложения (iOS)
   */
  private async updateBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        // Убеждаемся, что count - это неотрицательное число
        const validCount = count >= 0 && !isNaN(count) ? count : 0;
        await notifee.setBadgeCount(validCount);
        console.log(`[iOS] Бейдж обновлен: ${validCount}`);
      } catch (error) {
        console.error('[iOS] Ошибка обновления бейджа:', error);
      }
    }
  }

  /**
   * Подписка на обновление токена (важно для iOS)
   */
  private setupTokenRefresh(): void {
    messaging().onTokenRefresh(async (_token: string) => {
      console.log(`[${Platform.OS}] Токен обновлён`);
      const freshToken = await this.getFreshToken();
      if (freshToken) {
        await SecureStorageService.saveValue(SecureStorageKeys.FCM_TOKEN_KEY, freshToken);
        // Отправляем новый токен на сервер
        await this.sendTokenToServer(freshToken);
      }
    });
  }

  /**
   * Отправка токена на сервер
   */
  private async sendTokenToServer(_token: string): Promise<void> {
    console.log(`[${Platform.OS}] Отправка токена на сервер временно отключена`);

    try {
      const userIdResult = await SecureStorageService.getValue(SecureStorageKeys.USER_ID);
      if (userIdResult.success && userIdResult.data) {
        console.log(
          `[${Platform.OS}] Токен отправлен на сервер для пользователя: ${userIdResult.data}`,
        );
      }
    } catch (error) {
      console.error(`[${Platform.OS}] Ошибка отправки токена на сервер:`, error);
    }
  }

  /**
   * Запрос разрешений на уведомления
   */
  private async requestPermission(): Promise<boolean> {
    try {
      const hasPermissionResult: SecureStorageResult<string | null> =
        await SecureStorageService.getValue(SecureStorageKeys.NOTIFICATION_PERMISSION_KEY);

      if (hasPermissionResult.success && hasPermissionResult.data === 'granted') {
        return true;
      }

      let permissionGranted;

      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        permissionGranted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (permissionGranted) {
          console.log('[iOS] Разрешения на уведомления получены');
        }
      } else {
        const androidVersion = Platform.Version;
        const versionNumber =
          typeof androidVersion === 'string' ? parseInt(androidVersion, 10) : androidVersion;

        if (versionNumber >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const enabled = await messaging().hasPermission();
          permissionGranted =
            enabled === messaging.AuthorizationStatus.AUTHORIZED ||
            enabled === messaging.AuthorizationStatus.PROVISIONAL;
        }
      }

      await SecureStorageService.saveValue(
        SecureStorageKeys.NOTIFICATION_PERMISSION_KEY,
        permissionGranted ? 'granted' : 'denied',
      );

      return permissionGranted;
    } catch (error) {
      console.error('Ошибка при запросе разрешения на уведомления:', error);
      return false;
    }
  }

  /**
   * Получение FCM токена
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const savedTokenResult: SecureStorageResult<string | null> =
        await SecureStorageService.getValue(SecureStorageKeys.FCM_TOKEN_KEY);

      console.log('[NotificationService] Saved token exists:', !!savedTokenResult.data);

      if (savedTokenResult.success && savedTokenResult.data) {
        if (Platform.OS === 'ios') {
          const freshToken = await this.getFreshToken();
          if (freshToken && freshToken !== savedTokenResult.data) {
            await SecureStorageService.saveValue(SecureStorageKeys.FCM_TOKEN_KEY, freshToken);
            await this.sendTokenToServer(freshToken);
            return freshToken;
          }
        }
        return savedTokenResult.data;
      }

      const freshToken = await this.getFreshToken();
      if (freshToken) {
        await SecureStorageService.saveValue(SecureStorageKeys.FCM_TOKEN_KEY, freshToken);
        await this.sendTokenToServer(freshToken);
        return freshToken;
      }

      return null;
    } catch (error) {
      console.error('Ошибка при получении FCM токена:', error);
      return null;
    }
  }

  /**
   * Получение свежего токена из FCM
   */
  private async getFreshToken(): Promise<string | null> {
    try {
      const enabled = await messaging().hasPermission();
      const hasPermission =
        enabled === messaging.AuthorizationStatus.AUTHORIZED ||
        enabled === messaging.AuthorizationStatus.PROVISIONAL;

      if (hasPermission) {
        const token = await messaging().getToken();
        if (token && token.length > 0) {
          console.log(`[${Platform.OS}] Получен свежий токен:`, `${token.substring(0, 20)}...`);
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении свежего токена:', error);
      return null;
    }
  }

  /**
   * Проверка дедупликации уведомлений
   */
  private shouldProcessNotification(
    messageId: string | undefined,
    title: string | undefined,
  ): boolean {
    const currentTime = Date.now();
    const safeTitle = title || '';
    const dedupeKey = messageId || `${safeTitle}_${currentTime}`;

    if (this.isProcessingForeground.has(dedupeKey)) {
      console.log(`[${Platform.OS}] Уведомление уже обрабатывается: ${dedupeKey}`);
      return false;
    }

    const lastTime = this.lastNotificationTime.get(safeTitle);
    if (lastTime && currentTime - lastTime < 5000) {
      console.log(`[${Platform.OS}] Похожее уведомление показывалось недавно: ${safeTitle}`);
      return false;
    }

    this.isProcessingForeground.add(dedupeKey);
    this.lastNotificationTime.set(safeTitle, currentTime);

    setTimeout(() => {
      this.isProcessingForeground.delete(dedupeKey);
    }, 10000);

    if (this.lastNotificationTime.size > 50) {
      const oldestKey = Array.from(this.lastNotificationTime.keys())[0];
      if (oldestKey) {
        this.lastNotificationTime.delete(oldestKey);
      }
    }

    return true;
  }

  /**
   * Настройка обработчиков сообщений
   */
  private setupMessageHandlers(): void {
    if (Platform.OS === 'android') {
      this.setupAndroidMessageHandlers();
    } else {
      this.setupIOSMessageHandlers();
    }
  }

  /**
   * Настройка обработчиков для Android
   */
  private setupAndroidMessageHandlers(): void {
    console.log('[Android] Настройка обработчиков сообщений');

    messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const messageId = remoteMessage.messageId;
      const title = remoteMessage.notification?.title;

      console.log('[Android] Уведомление получено в foreground:', messageId);

      if (!this.shouldProcessNotification(messageId, title)) {
        return;
      }

      const notification = this.transformMessageToNotification(remoteMessage);

      // Показываем уведомление в foreground
      await this.showLocalNotification(notification, true);

      this.notifyHandlersFromInstance(notification);
    });

    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[Android] Уведомление обработано в background:', remoteMessage.messageId);
        const notification = this.transformMessageToNotification(remoteMessage);

        // В background показываем уведомление
        await this.showLocalNotification(notification, false);
        this.notifyHandlersFromInstance(notification);

        return Promise.resolve();
      },
    );

    messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[Android] Приложение открыто по уведомлению:', remoteMessage.messageId);
      const notification = this.transformMessageToNotification(remoteMessage);
      this.notifyHandlersFromInstance(notification);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          console.log('[Android] Первоначальное уведомление:', remoteMessage.messageId);
          this.initialNotification = remoteMessage;
          const notification = this.transformMessageToNotification(remoteMessage);
          this.notifyHandlersFromInstance(notification);
        }
      })
      .catch((error: Error) => {
        console.error('[Android] Ошибка получения initial notification:', error);
      });
  }

  /**
   * Настройка обработчиков для iOS
   */
  private setupIOSMessageHandlers(): void {
    console.log('[iOS] Настройка обработчиков сообщений');

    this.setupIOSNativeEventHandlers();
    this.setupIOSFirebaseHandlers();
  }

  /**
   * Настройка нативных обработчиков событий для iOS
   */
  private setupIOSNativeEventHandlers(): void {
    if (!this.nativeEventEmitter) {
      console.warn('[iOS] NativeEventEmitter не доступен');
      return;
    }

    this.nativeEventEmitter.addListener('FCMNotificationReceived', async (data: unknown) => {
      console.log('[iOS] Уведомление получено через нативный мост');
      const notification = this.transformNativeDataToNotification(data, true);

      // Показываем уведомление
      await this.showLocalNotification(notification, true);
      this.notifyHandlersFromInstance(notification);
    });

    this.nativeEventEmitter.addListener('NotificationOpened', (data: unknown) => {
      console.log('[iOS] Уведомление открыто через нативный мост');
      const notification = this.transformNativeDataToNotification(data, false);
      this.notifyHandlersFromInstance(notification);
    });

    this.nativeEventEmitter.addListener('SilentPushReceived', (data: unknown) => {
      console.log('[iOS] Silent push получен');
      this.handleSilentPush(data as Record<string, string>);
    });
  }

  /**
   * Настройка Firebase обработчиков для iOS
   */
  private setupIOSFirebaseHandlers(): void {
    try {
      messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const messageId = remoteMessage.messageId;
        const title = remoteMessage.notification?.title;

        console.log('[iOS] Уведомление получено через FCM (foreground):', messageId);

        if (!this.shouldProcessNotification(messageId, title)) {
          return;
        }

        const notification = this.transformMessageToNotification(remoteMessage);

        // Показываем уведомление в foreground
        await this.showLocalNotification(notification, true);
        this.notifyHandlersFromInstance(notification);
      });

      messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[iOS] Приложение открыто по уведомлению (FCM):', remoteMessage.messageId);
        const notification = this.transformMessageToNotification(remoteMessage);
        this.notifyHandlersFromInstance(notification);
      });

      messaging()
        .getInitialNotification()
        .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
          if (remoteMessage) {
            console.log('[iOS] Первоначальное уведомление (FCM):', remoteMessage.messageId);
            this.initialNotification = remoteMessage;
            const notification = this.transformMessageToNotification(remoteMessage);
            this.notifyHandlersFromInstance(notification);
          }
        })
        .catch((error: Error) => {
          console.warn('[iOS] Ошибка получения initial notification:', error);
        });

      messaging().setBackgroundMessageHandler(
        async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          console.log('[iOS] Фоновое сообщение получено (FCM):', remoteMessage.messageId);

          const isSilent = !remoteMessage.notification && remoteMessage.data;
          if (isSilent) {
            console.log('[iOS] Silent push через FCM');
            this.handleSilentPush(remoteMessage.data as Record<string, string>);
          }

          const notification = this.transformMessageToNotification(remoteMessage);

          // В background показываем уведомление
          await this.showLocalNotification(notification, false);
          this.notifyHandlersFromInstance(notification);

          return Promise.resolve();
        },
      );
    } catch (error) {
      console.warn('[iOS] Некоторые FCM методы могут не работать:', error);
    }
  }

  /**
   * Преобразование нативных данных iOS в уведомление
   */
  private transformNativeDataToNotification(
    data: unknown,
    isForeground: boolean,
  ): NotificationPayload {
    const iosData = data as IOSNotificationData;
    const notificationData = iosData.data || iosData;
    const isSilent = iosData.isSilent || false;

    let sound: string = 'default';
    const soundFromData = iosData.sound;

    if (soundFromData) {
      if (typeof soundFromData === 'string') {
        sound = soundFromData;
      } else if (
        typeof soundFromData === 'object' &&
        'name' in soundFromData &&
        typeof soundFromData.name === 'string'
      ) {
        sound = soundFromData.name;
      }
    }

    const notificationObj = iosData.notification;

    let title = '';
    let body = '';
    const dataForPayload: Record<string, string> = {};

    if (notificationData && typeof notificationData === 'object') {
      Object.keys(notificationData).forEach((key) => {
        const value = (notificationData as Record<string, unknown>)[key];
        if (typeof value === 'string') {
          dataForPayload[key] = value;
        } else if (typeof value === 'number') {
          dataForPayload[key] = String(value);
        }
      });

      title = dataForPayload.title || '';
      body = dataForPayload.body || '';
    }

    if (notificationObj && typeof notificationObj === 'object') {
      if ('title' in notificationObj && typeof notificationObj.title === 'string') {
        title = notificationObj.title;
      }
      if ('body' in notificationObj && typeof notificationObj.body === 'string') {
        body = notificationObj.body;
      }
    }

    let badge: number | undefined;
    if (
      iosData.badge !== undefined &&
      iosData.badge !== null &&
      iosData.badge >= 0 &&
      !isNaN(iosData.badge)
    ) {
      badge = iosData.badge;
    }

    const result: NotificationPayload = {
      title,
      body,
      data: dataForPayload,
      messageId: iosData.messageId || Date.now().toString(),
      platform: 'ios',
      isForeground,
      isSilent,
      sound,
    };

    if (badge !== undefined) {
      result.badge = badge;
      this.updateBadgeCount(badge).catch((err) => console.error('Ошибка обновления бейджа:', err));
    }

    return result;
  }

  /**
   * Обработка silent push notifications для iOS
   */
  private handleSilentPush(data: Record<string, string>): void {
    console.log('[iOS] Обработка silent push:', data);

    if (this.nativeEventEmitter) {
      this.nativeEventEmitter.emit('DataUpdated', data);
    }
  }

  /**
   * Проверка initial notification
   */
  private async checkInitialNotification(): Promise<void> {
    if (!this.initialNotification) {
      try {
        this.initialNotification = await messaging().getInitialNotification();
      } catch (error) {
        console.error('Ошибка при проверке initial notification:', error);
      }
    }

    if (this.initialNotification) {
      const notification = this.transformMessageToNotification(this.initialNotification);
      this.notifyHandlersFromInstance(notification);
    }
  }

  /**
   * Преобразование Firebase сообщения в формат уведомления
   */
  private transformMessageToNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  ): NotificationPayload {
    const { notification, data, messageId } = remoteMessage;

    const extendedNotification = notification as ExtendedNotification | undefined;

    let title = extendedNotification?.title || '';
    let body = extendedNotification?.body || '';

    if (!title && data?.title) {
      title = typeof data.title === 'string' ? data.title : '';
    }
    if (!body && data?.body) {
      body = typeof data.body === 'string' ? data.body : '';
    }

    let badge: number | undefined;
    if (data?.badge) {
      const parsedBadge = parseInt(String(data.badge), 10);
      if (!isNaN(parsedBadge) && parsedBadge >= 0) {
        badge = parsedBadge;
      }
    }

    let sound: string = 'default';
    const notificationSound = extendedNotification?.sound;

    if (notificationSound) {
      sound = notificationSound;
    } else if (data?.sound && typeof data.sound === 'string') {
      sound = data.sound;
    }

    const payloadData: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (typeof value === 'string') {
          payloadData[key] = value;
        }
      });
    }

    const result: NotificationPayload = {
      title,
      body,
      data: payloadData,
      messageId: messageId || Date.now().toString(),
      sound,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
      isForeground: false,
    };

    if (badge !== undefined) {
      result.badge = badge;
      this.updateBadgeCount(badge).catch((err) => console.error('Ошибка обновления бейджа:', err));
    }

    return result;
  }

  /**
   * Уведомление всех подписчиков (метод экземпляра)
   */
  private notifyHandlersFromInstance(notification: NotificationPayload): void {
    console.log(`[${Platform.OS}] Уведомление отправлено подписчикам:`, {
      title: notification.title,
      messageId: notification.messageId,
      platform: notification.platform,
      eventType: notification.eventType,
    });

    NotificationService.notifySubscribers(notification);
  }
}

// Экспортируем инстанс как дефолтный экспорт
export default NotificationService.getInstance();
