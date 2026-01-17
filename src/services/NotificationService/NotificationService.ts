// NotificationService.ts
import messaging, {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {NativeEventEmitter, NativeModules, PermissionsAndroid, Platform} from 'react-native';
import {SecureStorageKeys, SecureStorageResult, SecureStorageService,} from '../SecureStorageService';
import {LocalNotification, NotificationHandler, NotificationPayload} from './types';

// Кастомный интерфейс для Notification со свойством sound
interface FirebaseNotificationWithSound extends FirebaseMessagingTypes.Notification {
  sound?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private static notificationHandlers: NotificationHandler[] = [];
  private initialNotification: FirebaseMessagingTypes.RemoteMessage | null = null;
  private nativeEventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;

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
   * Статический метод для преобразования Firebase сообщения
   */
  public transformFirebaseMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  ): LocalNotification {
    const { notification, data, messageId } = remoteMessage;

    // Создаем базовый объект LocalNotification
    const localNotification: LocalNotification = {
      title: notification?.title || '',
      body: notification?.body || '',
      data: data ? (data as Record<string, string>) : {},
      timestamp: Date.now(),
      id: messageId || Date.now().toString(),
    };

    return localNotification;
  }

  /**
   * Статический метод для уведомления подписчиков
   */
  public notifySubscribers(notification: LocalNotification): void {
    // Преобразуем LocalNotification в NotificationPayload
    const payload: NotificationPayload = {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      messageId: notification.id,
    };

    // Уведомляем подписчиков
    NotificationService.notifyHandlers(payload);
  }

  /**
   * Статический метод для уведомления всех подписчиков
   */
  private static notifyHandlers(notification: NotificationPayload): void {
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
   * Проверка инициализации сервиса
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
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

      let permissionGranted = false;

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
      console.log('[Android] Уведомление получено в foreground:', remoteMessage);

      const notification = this.transformMessageToNotification(remoteMessage);
      this.notifyHandlersFromInstance(notification);
    });

    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[Android] Уведомление обработано в background:', remoteMessage);

        const notification = this.transformMessageToNotification(remoteMessage);
        this.notifyHandlersFromInstance(notification);

        return Promise.resolve();
      },
    );

    messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[Android] Приложение открыто по уведомлению:', remoteMessage);

      const notification = this.transformMessageToNotification(remoteMessage);
      this.notifyHandlersFromInstance(notification);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          console.log('[Android] Первоначальное уведомление:', remoteMessage);
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
        console.log('[iOS] Уведомление получено через FCM (foreground):', remoteMessage);

        const notification = this.transformMessageToNotification(remoteMessage);
        this.notifyHandlersFromInstance(notification);
      });

      messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[iOS] Приложение открыто по уведомлению (FCM):', remoteMessage);

        const notification = this.transformMessageToNotification(remoteMessage);
        this.notifyHandlersFromInstance(notification);
      });

      messaging()
        .getInitialNotification()
        .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
          if (remoteMessage) {
            console.log('[iOS] Первоначальное уведомление (FCM):', remoteMessage);
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
          console.log('[iOS] Фоновое сообщение получено (FCM):', remoteMessage);

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

    // Безопасное получение sound - проверяем, что это строка
    let sound: string | undefined = 'default';
    const soundFromData = dataObj?.sound;

    if (soundFromData) {
      if (typeof soundFromData === 'string') {
        sound = soundFromData;
      } else if (typeof soundFromData === 'object' && soundFromData !== null) {
        const soundObj = soundFromData as Record<string, any>;
        if (soundObj.name && typeof soundObj.name === 'string') {
          sound = soundObj.name;
        }
      }
    }

    // Получаем notification объект из dataObj
    const notificationObj = dataObj?.notification as Record<string, any> | undefined;

    // Если есть notification в dataObj, используем его поля
    const title =
      (notificationData as Record<string, string>)?.title || notificationObj?.title || '';

    const body = (notificationData as Record<string, string>)?.body || notificationObj?.body || '';

    const payload: NotificationPayload = {
      title,
      body,
      data: (notificationData as Record<string, string>) || {},
      messageId: (dataObj?.messageId as string) || Date.now().toString(),
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
      isForeground,
      isSilent,
      badge: dataObj?.badge ? parseInt(dataObj.badge as string, 10) : undefined,
      sound,
    };

    return payload;
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
        const remoteMessage = await messaging().getInitialNotification();
        this.initialNotification = remoteMessage;
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

    // Используем кастомный интерфейс для безопасного доступа к sound
    const notificationWithSound = notification as FirebaseNotificationWithSound;

    let title = notificationWithSound?.title;
    let body = notificationWithSound?.body;

    if (!title && data?.title) {
      title = data.title as string;
    }
    if (!body && data?.body) {
      body = data.body as string;
    }

    const badge = data?.badge ? parseInt(data.badge as string, 10) : undefined;

    // Безопасное получение sound с проверкой типа
    let sound: string | undefined = 'default';

    // Проверяем notification.sound
    const notificationSound = notificationWithSound?.sound;
    if (notificationSound && typeof notificationSound === 'string') {
      sound = notificationSound;
    }
    // Проверяем data.sound
    else if (data?.sound) {
      if (typeof data.sound === 'string') {
        sound = data.sound;
      }
      // Если data.sound это объект, можно попытаться извлечь имя звука
      else if (typeof data.sound === 'object' && data.sound !== null) {
        const soundObj = data.sound as Record<string, any>;
        if (soundObj.name && typeof soundObj.name === 'string') {
          sound = soundObj.name;
        }
      }
    }

    const payload: NotificationPayload = {
      title: title || '',
      body: body || '',
      data: data ? (data as Record<string, string>) : {},
      messageId: messageId || Date.now().toString(),
      badge,
      sound,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
    };

    return payload;
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

    const handlers = [...NotificationService.notificationHandlers];
    handlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error(`[${Platform.OS}] Ошибка в обработчике уведомлений:`, error);
      }
    });
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
   * Создание канала уведомлений (Android)
   */
  async createNotificationChannel(
    channelId: string,
    channelName: string,
    _importance = 4,
  ): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        const versionNumber =
          typeof androidVersion === 'string' ? parseInt(androidVersion, 10) : androidVersion;

        if (versionNumber >= 26) {
          console.log(`Создание канала уведомлений: ${channelName} (${channelId})`);
          // Создание канала через notifee или другую библиотеку
        }
      } catch (error) {
        console.error('Ошибка при создании канала уведомлений:', error);
      }
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

    console.log(`[${Platform.OS}] Ресурсы NotificationService очищены`);
  }
}

// Экспортируем инстанс как дефолтный экспорт
export default NotificationService.getInstance();
