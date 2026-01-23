// NotificationService.ts
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import _ from 'lodash';
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  SecureStorageKeys,
  SecureStorageResult,
  SecureStorageService,
} from '../SecureStorageService';
import { NotificationHandler, NotificationPayload } from './types';

// Интерфейс для расширенного notification с полем sound
interface ExtendedNotification extends FirebaseMessagingTypes.Notification {
  sound?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private static notificationHandlers: NotificationHandler[] = [];
  private initialNotification: FirebaseMessagingTypes.RemoteMessage | null = null;
  private nativeEventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;
  private isProcessingForeground = new Set<string>();
  private lastNotificationTime = new Map<string, number>();

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
   * Инициализация сервиса уведомлений
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`[${Platform.OS}] Сервис уведомлений уже инициализирован`);
      return;
    }

    try {
      console.log(`[${Platform.OS}] Инициализация сервиса уведомлений...`);

      // Запрашиваем разрешения
      await this.requestPermission();

      // Получаем FCM токен
      await this.getFCMToken();

      // Настраиваем обработчики сообщений (только подписчики, не показ уведомлений)
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

      console.log('savedTokenResult: ', JSON.stringify(savedTokenResult.data));

      if (savedTokenResult.success && savedTokenResult.data) {
        return savedTokenResult.data;
      }

      const enabled = await messaging().hasPermission();
      const hasPermission =
        enabled === messaging.AuthorizationStatus.AUTHORIZED ||
        enabled === messaging.AuthorizationStatus.PROVISIONAL;

      if (hasPermission) {
        const token = await messaging().getToken();
        if (token) {
          await SecureStorageService.saveValue(SecureStorageKeys.FCM_TOKEN_KEY, token);
          return token;
        }
      }

      return null;
    } catch (error) {
      console.error('Ошибка при получении FCM токена:', error);
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

    // Проверяем, обрабатывается ли уже это уведомление
    if (this.isProcessingForeground.has(dedupeKey)) {
      console.log(`[${Platform.OS}] Уведомление уже обрабатывается: ${dedupeKey}`);
      return false;
    }

    // Проверяем время последнего показа похожего уведомления
    const lastTime = this.lastNotificationTime.get(safeTitle);
    if (lastTime && currentTime - lastTime < 5000) {
      console.log(`[${Platform.OS}] Похожее уведомление показывалось недавно: ${safeTitle}`);
      return false;
    }

    this.isProcessingForeground.add(dedupeKey);
    this.lastNotificationTime.set(safeTitle, currentTime);

    // Очищаем старые записи
    setTimeout(() => {
      this.isProcessingForeground.delete(dedupeKey);
    }, 10000);

    // Ограничиваем размер Map
    if (this.lastNotificationTime.size > 50) {
      const oldestKey = this.lastNotificationTime.keys().next().value;
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
    console.log('[Android] Настройка обработчиков сообщений (только подписчики)');

    messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const messageId = remoteMessage.messageId;
      const title = remoteMessage.notification?.title;

      console.log('[Android] Уведомление получено в foreground:', messageId);

      // Проверка дедупликации
      if (!this.shouldProcessNotification(messageId, title)) {
        return;
      }

      // Только преобразуем и уведомляем подписчиков
      // Показ уведомления будет обрабатываться NotifeeService
      const notification = this.transformMessageToNotification(remoteMessage);
      this.notifyHandlersFromInstance(notification);
    });

    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[Android] Уведомление обработано в background:', remoteMessage.messageId);

        const notification = this.transformMessageToNotification(remoteMessage);
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

    this.nativeEventEmitter.addListener('FCMNotificationReceived', (data: unknown) => {
      console.log('[iOS] Уведомление получено через нативный мост:', data);

      const notification = this.transformNativeDataToNotification(data, true);
      this.notifyHandlersFromInstance(notification);
    });

    this.nativeEventEmitter.addListener('NotificationOpened', (data: unknown) => {
      console.log('[iOS] Уведомление открыто через нативный мост:', data);

      const notification = this.transformNativeDataToNotification(data, false);
      this.notifyHandlersFromInstance(notification);
    });

    this.nativeEventEmitter.addListener('SilentPushReceived', (data: unknown) => {
      console.log('[iOS] Silent push получен:', data);
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

        // Проверка дедупликации
        if (!this.shouldProcessNotification(messageId, title)) {
          return;
        }

        const notification = this.transformMessageToNotification(remoteMessage);
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
            console.log('[iOS] Silent push через FCM:', remoteMessage.data);
            this.handleSilentPush(remoteMessage.data as Record<string, string>);
          }

          const notification = this.transformMessageToNotification(remoteMessage);
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
    const dataObj = data as Record<string, unknown> | null;
    const notificationData = dataObj?.data || dataObj;
    const isSilent = (dataObj?.isSilent as boolean) || false;

    // Безопасное получение sound
    let sound: string | undefined = 'default';
    const soundFromData = dataObj?.sound;

    if (soundFromData) {
      if (typeof soundFromData === 'string') {
        sound = soundFromData;
      } else if (typeof soundFromData === 'object') {
        const soundObj = soundFromData as Record<string, unknown>;
        if (soundObj.name && typeof soundObj.name === 'string') {
          sound = soundObj.name;
        }
      }
    }

    // Получаем notification объект из dataObj
    const notificationObj = dataObj?.notification as Record<string, unknown> | undefined;

    // Если есть notification в dataObj, используем его поля
    const notificationDataObj = notificationData as Record<string, unknown> | null;

    let title = '';
    let body = '';
    const dataForPayload: Record<string, string> = {};

    if (notificationDataObj) {
      // Извлекаем данные для payload
      Object.keys(notificationDataObj).forEach((key) => {
        const value = notificationDataObj[key];
        if (typeof value === 'string') {
          dataForPayload[key] = value;
        } else if (typeof value === 'number') {
          dataForPayload[key] = value.toString();
        }
      });

      // Получаем title и body
      title = (notificationDataObj.title as string) || '';
      body = (notificationDataObj.body as string) || '';
    }

    // Приоритет: notificationObj > dataObj
    if (notificationObj?.title && typeof notificationObj.title === 'string') {
      title = notificationObj.title;
    }
    if (notificationObj?.body && typeof notificationObj.body === 'string') {
      body = notificationObj.body;
    }

    const badge = dataObj?.badge ? parseInt(String(dataObj.badge), 10) : undefined;

    return {
      title,
      body,
      data: dataForPayload,
      messageId: (dataObj?.messageId as string) || Date.now().toString(),
      platform: Platform.OS as 'ios' | 'android' | undefined,
      isForeground,
      isSilent,
      badge,
      sound,
    } as NotificationPayload;
  }

  /**
   * Обработка silent push notifications для iOS
   */
  private handleSilentPush(data: Record<string, string>): void {
    console.log('[iOS] Обработка silent push:', data);

    if (this.nativeEventEmitter) {
      this.nativeEventEmitter.emit('DataUpdated', data);
    }

    if (data.type === 'data_update') {
      this.processDataUpdate(data);
    }

    if (data.type === 'sync') {
      this.triggerDataSync(data);
    }
  }

  /**
   * Обработка обновления данных
   */
  private processDataUpdate(data: Record<string, string>): void {
    console.log('[iOS] Обработка обновления данных:', data);
  }

  /**
   * Триггер синхронизации данных
   */
  private triggerDataSync(data: Record<string, string>): void {
    console.log('[iOS] Запуск синхронизации данных:', data);
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

    // Используем расширенный интерфейс для доступа к sound
    const extendedNotification = notification as ExtendedNotification | undefined;

    let title = extendedNotification?.title;
    let body = extendedNotification?.body;

    if (!title && data?.title) {
      title = data.title as string;
    }
    if (!body && data?.body) {
      body = data.body as string;
    }

    const badge = data?.badge ? parseInt(String(data.badge), 10) : undefined;

    // Безопасное получение sound с проверкой типа
    let sound: string | undefined = 'default';

    // Проверяем notification.sound через расширенный интерфейс
    const notificationSound = extendedNotification?.sound;
    if (notificationSound) {
      sound = notificationSound;
    }
    // Проверяем data.sound
    else if (data?.sound) {
      if (typeof data.sound === 'string') {
        sound = data.sound;
      }
      // Если data.sound это объект, можно попытаться извлечь имя звука
      else if (typeof data.sound === 'object') {
        const soundObj = data.sound as Record<string, unknown>;
        if (soundObj.name && typeof soundObj.name === 'string') {
          sound = soundObj.name;
        }
      }
    }

    const payloadData: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (typeof value === 'string') {
          payloadData[key] = value;
        } else if (_.isNumber(value)) {
          payloadData[key] = (value as number).toString(); // Type assertion
        }
      });
    }

    return {
      title: title || '',
      body: body || '',
      data: payloadData,
      messageId: messageId || Date.now().toString(),
      badge,
      sound,
      platform: Platform.OS as 'ios' | 'android' | undefined,
    } as NotificationPayload;
  }

  /**
   * Уведомление всех подписчиков (метод экземпляра)
   */
  private notifyHandlersFromInstance(notification: NotificationPayload): void {
    console.log(`[${Platform.OS}] Уведомление отправлено подписчикам:`, {
      title: notification.title,
      messageId: notification.messageId,
      platform: notification.platform,
    });

    NotificationService.notifySubscribers(notification);
  }

  /**
   * Подписка на уведомления
   */
  subscribe(handler: NotificationHandler): void {
    if (!NotificationService.notificationHandlers.includes(handler)) {
      NotificationService.notificationHandlers.push(handler);
    }
  }

  /**
   * Отписка от уведомлений
   */
  unsubscribe(handler: NotificationHandler): void {
    NotificationService.notificationHandlers = NotificationService.notificationHandlers.filter(
      (h) => h !== handler,
    );
  }

  /**
   * Удаление FCM токена (для логаута)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      const removeResult = await SecureStorageService.removeValue(SecureStorageKeys.FCM_TOKEN_KEY);

      if (removeResult.success) {
        console.log('FCM токен удален');
      } else {
        console.warn('Не удалось удалить FCM токен из хранилища');
      }
    } catch (error) {
      console.error('Ошибка при удалении FCM токена:', error);
    }
  }

  /**
   * Получение текущего статуса разрешений
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const statusResult: SecureStorageResult<string | null> = await SecureStorageService.getValue(
        SecureStorageKeys.NOTIFICATION_PERMISSION_KEY,
      );

      if (statusResult.success && statusResult.data) {
        return statusResult.data;
      }
      return 'not_determined';
    } catch (error) {
      console.error('Ошибка при получении статуса разрешений:', error);
      return 'unknown';
    }
  }

  /**
   * Получение текущего initial notification
   */
  getInitialNotification(): FirebaseMessagingTypes.RemoteMessage | null {
    return this.initialNotification;
  }

  /**
   * Очистка initial notification
   */
  clearInitialNotification(): void {
    this.initialNotification = null;
  }

  /**
   * Очистка ресурсов при размонтировании
   */
  cleanup(): void {
    if (this.nativeEventEmitter) {
      this.nativeEventEmitter.removeAllListeners('FCMNotificationReceived');
      this.nativeEventEmitter.removeAllListeners('NotificationOpened');
      this.nativeEventEmitter.removeAllListeners('SilentPushReceived');
    }

    this.isInitialized = false;
    this.isProcessingForeground.clear();
    this.lastNotificationTime.clear();

    console.log(`[${Platform.OS}] Ресурсы NotificationService очищены`);
  }
}

// Экспортируем инстанс как дефолтный экспорт
export default NotificationService.getInstance();
