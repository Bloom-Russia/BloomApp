import notifee, {
  type AndroidAction,
  type AndroidChannel,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type IOSInput,
  type Notification,
  type NotificationSettings,
  RepeatFrequency,
  type TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { NOTIFICATION_COLORS } from './constants';
import type {
  BackgroundMessageHandler,
  FirebaseNotificationData,
  NotifeeOptions,
  NotificationAction,
  NotificationCallback,
  NotificationEvent,
  NotificationEventHandler,
  NotificationPriority,
  NotificationType,
} from './types';

class NotifeeServiceClass {
  private channelIds: Map<string, string> = new Map();
  private notificationHandlers: NotificationCallback[] = [];
  private eventHandlers: NotificationEventHandler[] = [];
  private backgroundMessageHandler?: BackgroundMessageHandler;

  // Приватный статический экземпляр для Singleton
  private static instance: NotifeeServiceClass | null = null;

  /**
   * Приватный конструктор для Singleton
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Получение единственного экземпляра сервиса
   */
  public static getInstance(): NotifeeServiceClass {
    if (!NotifeeServiceClass.instance) {
      NotifeeServiceClass.instance = new NotifeeServiceClass();
    }
    return NotifeeServiceClass.instance;
  }

  /**
   * Статический метод для обработки действий уведомлений
   */
  public static processNotificationAction(event: NotificationEvent): void {
    console.log('Обработка действия уведомления:', event);
  }

  /**
   * Инициализация сервиса (публичный метод для ручного вызова)
   */
  public async initializeService(): Promise<void> {
    try {
      console.log('Инициализация сервиса уведомлений...');
      await this.requestPermissions();

      // Создаем каналы/категории в зависимости от платформы
      if (Platform.OS === 'android') {
        await this.createDefaultChannels();
      } else if (Platform.OS === 'ios') {
        await this.createIosCategories();
      }

      console.log('Сервис уведомлений успешно инициализирован');
    } catch (error: unknown) {
      console.error('Ошибка инициализации сервиса уведомлений:', error);
      throw error;
    }
  }

  /**
   * Приватная инициализация
   */
  private async initialize(): Promise<void> {
    try {
      console.log('Инициализация сервиса уведомлений...');

      // Запрашиваем разрешения при инициализации
      await this.requestPermissions();

      // Создаем каналы/категории в зависимости от платформы
      if (Platform.OS === 'android') {
        await this.createDefaultChannels();
      } else if (Platform.OS === 'ios') {
        await this.createIosCategories();
      }

      // Слушаем события уведомлений
      this.setupEventListeners();
    } catch (error: unknown) {
      console.error('Ошибка инициализации сервиса уведомлений:', error);
    }
  }

  /**
   * Запрос разрешений на уведомления
   */
  public async requestPermissions(): Promise<NotificationSettings> {
    try {
      // Для iOS используем более детальную конфигурацию
      const permissionOptions =
        Platform.OS === 'ios'
          ? {
              alert: true,
              announcement: false,
              badge: true,
              carPlay: true,
              criticalAlert: false,
              provisional: false, // Временные разрешения (iOS 12+)
              sound: true,
            }
          : undefined;

      const settings = await notifee.requestPermission(permissionOptions);

      console.log('Статус разрешений уведомлений:', {
        authorizationStatus: settings.authorizationStatus,
        android: settings.android,
        ios: settings.ios,
      });

      if (settings.authorizationStatus >= 3) {
        console.log('Разрешения на уведомления предоставлены');
      } else {
        console.log('Разрешения на уведомления отклонены или ограничены');
      }

      return settings;
    } catch (error: unknown) {
      console.error('Ошибка запроса разрешений на уведомления:', error);
      throw error;
    }
  }

  /**
   * Создание категорий для iOS (для действий в уведомлениях)
   */
  private async createIosCategories(): Promise<void> {
    try {
      await notifee.setNotificationCategories([
        {
          id: 'default',
          actions: [
            {
              id: 'view',
              title: 'Просмотр',
              foreground: true,
            },
            {
              id: 'dismiss',
              title: 'Отклонить',
              destructive: true,
              foreground: false,
              authenticationRequired: false,
            },
          ],
        },
        {
          id: 'CUSTOM_ACTIONS',
          actions: [
            {
              id: 'like',
              title: '❤️ Нравится',
              foreground: true,
            },
            {
              id: 'save',
              title: '💾 Сохранить',
              foreground: true,
            },
            {
              id: 'reply',
              title: 'Ответить',
              foreground: true,
              input: {
                placeholderText: 'Введите ответ...',
                buttonTitle: 'Отправить',
              } as IOSInput,
            },
          ],
        },
      ]);
      console.log('iOS категории уведомлений созданы');
    } catch (error: unknown) {
      console.error('Ошибка создания iOS категорий:', error);
    }
  }

  /**
   * Установить обработчик фоновых сообщений
   */
  public setBackgroundMessageHandler(handler: BackgroundMessageHandler): void {
    this.backgroundMessageHandler = handler;
  }

  /**
   * Обработка фонового сообщения
   */
  public async handleBackgroundMessage(remoteMessage: FirebaseNotificationData): Promise<void> {
    try {
      console.log('Получено фоновое сообщение:', remoteMessage);

      // Для iOS требуется особая обработка
      if (Platform.OS === 'ios') {
        await this.processIosBackgroundMessage(remoteMessage);
      } else {
        // Для Android показываем уведомление если есть данные
        if (remoteMessage.notification || remoteMessage.data) {
          await this.showNotificationFromFirebase(remoteMessage);
        }
      }

      // Если есть установленный обработчик, вызываем его
      if (this.backgroundMessageHandler) {
        await this.backgroundMessageHandler(remoteMessage);
      }
    } catch (error: unknown) {
      console.error('Ошибка обработки фонового сообщения:', error);
    }
  }

  /**
   * Обработка фоновых сообщений для iOS
   */
  private async processIosBackgroundMessage(
    remoteMessage: FirebaseNotificationData,
  ): Promise<void> {
    try {
      const { notification, data } = remoteMessage;

      // Для iOS всегда показываем уведомление, даже если есть только data
      if (notification || data) {
        const notificationData: FirebaseNotificationData = {
          ...remoteMessage,
          // Убеждаемся, что notification существует для iOS
          notification: notification || {
            title: (data?.title as string) || 'Уведомление',
            body: (data?.body as string) || 'Новое сообщение',
          },
        };

        await this.showNotificationFromFirebase(notificationData);
      }
    } catch (error: unknown) {
      console.error('Ошибка обработки iOS фонового сообщения:', error);
    }
  }

  /**
   * Показать уведомление из данных Firebase
   */
  public async showNotificationFromFirebase(
    remoteMessage: FirebaseNotificationData,
  ): Promise<string> {
    const { notification, data } = remoteMessage;

    // Для iOS может быть только data без notification
    if (!notification && !data) {
      throw new Error('Нет данных уведомления');
    }

    const options: NotifeeOptions = {
      title: notification?.title || (data?.title as string) || 'Уведомление',
      body: notification?.body || (data?.body as string) || '',
      data: data || {},
      priority: this.getPriorityFromFirebase(remoteMessage.priority),
    };

    // Добавляем дополнительные настройки для iOS
    if (Platform.OS === 'ios') {
      options.ios = {
        sound: 'default',
        critical: remoteMessage.priority === 2, // HIGH приоритет
      };
    }

    return this.showNotification(options);
  }

  /**
   * Преобразование приоритета из Firebase в Notifee
   */
  private getPriorityFromFirebase(firebasePriority?: number): NotificationPriority {
    switch (firebasePriority) {
      case 2: // HIGH
        return 'high';
      case 0: // NORMAL
        return 'default';
      case 1: // DEFAULT
        return 'default';
      default:
        return 'default';
    }
  }

  /**
   * Подписка на получение уведомлений
   */
  public subscribe(handler: NotificationCallback): () => void {
    this.notificationHandlers.push(handler);
    return (): void => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Подписка на события уведомлений
   */
  public onNotificationEvent(handler: NotificationEventHandler): () => void {
    this.eventHandlers.push(handler);
    return (): void => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Создание каналов по умолчанию (только для Android)
   */
  private async createDefaultChannels(): Promise<void> {
    const channels: AndroidChannel[] = [
      {
        id: 'alerts',
        name: 'Важные уведомления',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: [300, 500],
        sound: 'default',
        lights: true,
        lightColor: '#FF0000',
      },
      {
        id: 'default',
        name: 'Основные уведомления',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      },
      {
        id: 'messages',
        name: 'Сообщения',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      },
      {
        id: 'silent',
        name: 'Тихие уведомления',
        importance: AndroidImportance.LOW,
        vibration: false,
        // Не указываем sound для тихих уведомлений
      },
    ];

    try {
      for (const channel of channels) {
        await notifee.createChannel(channel);
        this.channelIds.set(channel.id, channel.id);
        console.log(`Канал уведомлений создан: ${channel.name}`);
      }
    } catch (error: unknown) {
      console.error('Ошибка создания канала уведомлений:', error);
    }
  }

  /**
   * Показать уведомление
   */
  public async showNotification(options: NotifeeOptions): Promise<string> {
    try {
      const {
        id,
        title,
        body = '',
        data = {},
        type = 'info',
        priority = 'default',
        android = {},
        ios = {},
        imageUrl,
        actions = [],
      } = options;

      // Получаем channelId (только для Android)
      const channelId = this.getChannelIdByType(type, priority);

      // Получаем цвет для уведомления
      const color = this.getColorByType(type);

      // Базовое уведомление
      const notification: Notification = {
        id: id || `${Date.now()}-${Math.random()}`,
        title,
        body,
        data: {
          ...data,
          // Добавляем timestamp для отслеживания
          timestamp: Date.now().toString(),
        },
        android: {
          channelId,
          importance: this.getAndroidImportance(priority),
          pressAction: { id: 'default' },
          smallIcon: 'notification_icon',
          color,
          ...android,
        },
        ios: {
          categoryId: type,
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
          sound: 'default',
          critical: priority === 'high',
          criticalVolume: 1.0,
          // Уникальный ID для iOS
          threadId: `thread_${type}`,
          summaryArgument: title,
          ...ios,
        },
      };

      // Добавление изображения
      if (imageUrl) {
        if (Platform.OS === 'ios') {
          notification.ios = {
            ...notification.ios,
            attachments: [{ url: imageUrl }],
          };
        } else {
          notification.android = {
            ...notification.android,
            largeIcon: imageUrl,
          };
        }
      }

      // Добавление действий (кнопок) в уведомление
      if (actions.length > 0) {
        if (Platform.OS === 'ios') {
          // Для iOS используем заранее созданные категории
          notification.ios = {
            ...notification.ios,
            categoryId: 'CUSTOM_ACTIONS',
          };
        } else {
          // Для Android создаем действия
          const androidActions: AndroidAction[] = (actions as NotificationAction[]).map(
            (action) => {
              const androidAction: AndroidAction = {
                title: action.title,
                pressAction: action.pressAction || { id: action.id },
              };

              if (action.input) {
                androidAction.input = {
                  allowFreeFormInput: true,
                  placeholder: action.input.placeholder,
                };
              }

              return androidAction;
            },
          );

          notification.android = {
            ...notification.android,
            actions: androidActions,
          };
        }
      }

      // Отображаем уведомление
      const notificationId = await notifee.displayNotification(notification);

      console.log(`Уведомление отображено [${Platform.OS}]:`, notificationId);

      // Уведомляем подписчиков
      this.notifySubscribers(notification);

      return notificationId;
    } catch (error: unknown) {
      console.error('Ошибка отображения уведомления:', error);

      // Добавляем дополнительную информацию для отладки iOS
      if (Platform.OS === 'ios') {
        console.error('Детали ошибки iOS:', {
          title: options.title,
          body: options.body,
          data: options.data,
        });
      }

      throw error;
    }
  }

  /**
   * Уведомить подписчиков о новом уведомлении
   */
  private notifySubscribers(notification: Notification): void {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error: unknown) {
        console.error('Ошибка в обработчике уведомления:', error);
      }
    });
  }

  /**
   * Уведомить подписчиков о событии уведомления
   */
  private notifyEventSubscribers(event: NotificationEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error: unknown) {
        console.error('Ошибка в обработчике события:', error);
      }
    });
  }

  /**
   * Получить список всех отображенных уведомлений
   */
  public async getDisplayedNotifications(): Promise<Notification[]> {
    try {
      const notifications = await notifee.getDisplayedNotifications();

      if (Array.isArray(notifications)) {
        return notifications;
      } else if (notifications && 'notifications' in notifications) {
        return (notifications as { notifications: Notification[] }).notifications || [];
      }
      return [];
    } catch (error: unknown) {
      console.error('Ошибка получения отображенных уведомлений:', error);
      throw error;
    }
  }

  /**
   * Открыть настройки уведомлений системы
   */
  public async openNotificationSettings(): Promise<void> {
    try {
      await notifee.openNotificationSettings();
    } catch (error: unknown) {
      console.error('Ошибка открытия настроек уведомлений:', error);
    }
  }

  /**
   * Открыть настройки канала (Android)
   */
  public async openChannelSettings(channelId: string): Promise<void> {
    try {
      console.log(`Открытие настроек для канала: ${channelId}`);
      await notifee.openNotificationSettings();
    } catch (error: unknown) {
      console.error('Ошибка открытия настроек канала:', error);
    }
  }

  /**
   * Быстрые методы для разных типов уведомлений
   */
  public async showInfo(
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<string> {
    return this.showNotification({
      title,
      body,
      data,
      type: 'info',
    });
  }

  public async showSuccess(
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<string> {
    return this.showNotification({
      title,
      body,
      data,
      type: 'success',
    });
  }

  public async showWarning(
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<string> {
    return this.showNotification({
      title,
      body,
      data,
      type: 'warning',
    });
  }

  public async showError(
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<string> {
    return this.showNotification({
      title,
      body,
      data,
      type: 'error',
      priority: 'high',
    });
  }

  /**
   * Запланировать уведомление на определенное время
   */
  public async scheduleNotification(
    options: NotifeeOptions & { timestamp: Date; repeat?: RepeatFrequency },
  ): Promise<string> {
    try {
      const { timestamp, repeat, ...notificationOptions } = options;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: timestamp.getTime(),
        repeatFrequency: repeat,
      };

      const notificationId = await notifee.createTriggerNotification(
        await this.buildNotificationConfig(notificationOptions),
        trigger,
      );

      console.log('Уведомление запланировано:', notificationId);
      return notificationId;
    } catch (error: unknown) {
      console.error('Ошибка планирования уведомления:', error);
      throw error;
    }
  }

  /**
   * Отменить конкретное уведомление
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      console.log(`Уведомление отменено: ${notificationId}`);
    } catch (error: unknown) {
      console.error('Ошибка отмены уведомления:', error);
      throw error;
    }
  }

  /**
   * Отменить все уведомления
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('Все уведомления отменены');
    } catch (error: unknown) {
      console.error('Ошибка отмены всех уведомлений:', error);
      throw error;
    }
  }

  /**
   * Получить все запланированные уведомления
   */
  public async getScheduledNotifications(): Promise<Notification[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications.map((n) => n.notification);
    } catch (error: unknown) {
      console.error('Ошибка получения запланированных уведомлений:', error);
      throw error;
    }
  }

  /**
   * Установить счетчик бейджей (iOS)
   */
  public async setBadgeCount(count: number): Promise<void> {
    try {
      await notifee.setBadgeCount(count);
      console.log(`Счетчик бейджей установлен: ${count}`);
    } catch (error: unknown) {
      console.error('Ошибка установки счетчика бейджей:', error);
    }
  }

  /**
   * Настройка слушателей событий уведомлений
   */
  private setupEventListeners(): void {
    // События когда приложение активно
    notifee.onForegroundEvent((event: NotificationEvent) => {
      console.log('Событие уведомления (foreground):', event.type);
      this.handleNotificationEvent(event);
    });

    // События когда приложение в фоне или закрыто
    notifee.onBackgroundEvent(async (event: NotificationEvent) => {
      console.log('Событие уведомления (background):', event.type);
      this.handleNotificationEvent(event);
    });
  }

  /**
   * Обработка событий уведомлений
   */
  private handleNotificationEvent(event: NotificationEvent): void {
    // Уведомляем подписчиков о событии
    this.notifyEventSubscribers(event);

    // Обрабатываем события
    switch (event.type) {
      case EventType.PRESS:
        console.log('Уведомление нажато:', event.detail.notification?.id);
        this.handleNotificationPress(event);
        break;

      case EventType.ACTION_PRESS:
        console.log('Действие нажато:', event.detail.pressAction?.id);
        this.handleNotificationAction(event);
        break;

      case EventType.DISMISSED:
        console.log('Уведомление отклонено:', event.detail.notification?.id);
        break;

      case EventType.DELIVERED:
        console.log('Уведомление доставлено:', event.detail.notification?.id);
        break;

      default:
        console.log('Необработанное событие уведомления:', event.type);
        break;
    }
  }

  /**
   * Обработка нажатия на уведомление
   */
  private handleNotificationPress(event: NotificationEvent): void {
    const notification = event.detail.notification;

    // Можно обработать навигацию на основе данных уведомления
    if (notification?.data?.screen) {
      console.log('Переход на экран:', notification.data.screen);
      // Здесь можно вызвать навигацию, например:
      // NavigationService.navigate(notification.data.screen, notification.data);
    }
  }

  /**
   * Обработка действий (кнопок) в уведомлении
   */
  private handleNotificationAction(event: NotificationEvent): void {
    const actionId = event.detail.pressAction?.id;
    const notification = event.detail.notification;

    switch (actionId) {
      case 'like':
        console.log('Пользователю понравилось:', notification?.data);
        // Отправка события "лайк" на сервер
        break;

      case 'save':
        console.log('Сохраняем:', notification?.data);
        // Сохранение контента
        break;

      case 'reply': {
        const userInput = (event.detail.input as { value?: string })?.value;
        console.log('Пользователь ответил:', userInput);
        // Отправка ответа на сервер
        break;
      }

      case 'view':
        console.log('Просмотр:', notification?.data);
        // Открытие деталей
        break;

      case 'dismiss':
        console.log('Уведомление отклонено пользователем');
        // Логика для отклонения
        break;

      default:
        console.log('Неизвестное действие:', actionId);
        break;
    }
  }

  /**
   * Получить channelId по типу и приоритету
   */
  private getChannelIdByType(type: NotificationType, priority: NotificationPriority): string {
    // Для iOS channelId не используется
    if (Platform.OS === 'ios') {
      return 'default';
    }

    if (priority === 'high') {
      return 'alerts';
    }
    if (type === 'error') {
      return 'alerts';
    }
    if (type === 'warning') {
      return 'messages';
    }
    return 'default';
  }

  /**
   * Получить Android важность по приоритету
   */
  private getAndroidImportance(priority: NotificationPriority): AndroidImportance {
    switch (priority) {
      case 'high':
        return AndroidImportance.HIGH;
      case 'low':
        return AndroidImportance.LOW;
      default:
        return AndroidImportance.DEFAULT;
    }
  }

  /**
   * Получить цвет по типу уведомления
   */
  private getColorByType(type: NotificationType): string {
    // Используем константы цветов вместо несуществующих свойств в Colors
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;
  }

  /**
   * Создать конфигурацию уведомления
   */
  private async buildNotificationConfig(options: NotifeeOptions): Promise<Notification> {
    const channelId = this.getChannelIdByType(
      options.type || 'info',
      options.priority || 'default',
    );

    const color = this.getColorByType(options.type || 'info');

    const notification: Notification = {
      id: options.id || `${Date.now()}-${Math.random()}`,
      title: options.title,
      body: options.body || '',
      data: options.data || {},
      android: {
        channelId,
        importance: this.getAndroidImportance(options.priority || 'default'),
        pressAction: { id: 'default' },
        smallIcon: 'notification_icon',
        color,
        ...options.android,
      },
      ios: {
        categoryId: options.type || 'info',
        foregroundPresentationOptions: {
          sound: true,
          badge: true,
          banner: true,
          list: true,
        },
        ...options.ios,
      },
    };

    // Добавление действий для Android
    if (options.actions && options.actions.length > 0 && Platform.OS === 'android') {
      const androidActions: AndroidAction[] = (options.actions as NotificationAction[]).map(
        (action) => {
          const androidAction: AndroidAction = {
            title: action.title,
            pressAction: action.pressAction || { id: action.id },
          };

          if (action.input) {
            androidAction.input = {
              allowFreeFormInput: true,
              placeholder: action.input.placeholder,
            };
          }

          return androidAction;
        },
      );

      notification.android = {
        ...notification.android,
        actions: androidActions,
      };
    }

    return notification;
  }

  /**
   * Тестовый метод для проверки уведомлений на iOS
   */
  public async testIosNotification(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('Тест доступен только для iOS');
      return;
    }

    try {
      // Проверяем текущие разрешения
      const settings = await notifee.getNotificationSettings();
      console.log('Текущие настройки iOS:', settings);

      // Показываем тестовое уведомление
      const notificationId = await this.showNotification({
        title: 'Тест iOS',
        body: 'Это тестовое уведомление для проверки работы на iOS',
        data: {
          test: 'true',
          timestamp: Date.now().toString(),
          screen: 'TestScreen',
        },
        priority: 'high',
        ios: {
          sound: 'default',
          critical: true,
        },
      });

      console.log('Тестовое уведомление отправлено:', notificationId);

      // Проверяем, что уведомление отобразилось
      setTimeout(async () => {
        const displayed = await this.getDisplayedNotifications();
        console.log('Отображенные уведомления:', displayed.length);
      }, 1000);
    } catch (error: unknown) {
      console.error('Ошибка тестирования iOS уведомлений:', error);
    }
  }

  /**
   * Проверить разрешения на уведомления
   */
  public async checkNotificationPermissions(): Promise<NotificationSettings> {
    try {
      const settings = await notifee.getNotificationSettings();
      console.log('Текущие разрешения:', settings);
      return settings;
    } catch (error: unknown) {
      console.error('Ошибка проверки разрешений:', error);
      throw error;
    }
  }

  /**
   * Получить все созданные каналы (Android)
   */
  public async getNotificationChannels(): Promise<AndroidChannel[]> {
    try {
      if (Platform.OS === 'android') {
        const channels = await notifee.getChannels();
        return channels;
      }
      return [];
    } catch (error: unknown) {
      console.error('Ошибка получения каналов:', error);
      return [];
    }
  }

  /**
   * Метод экземпляра для обработки действий уведомлений
   * (альтернатива статическому методу)
   */
  public processNotificationActionInstance(event: NotificationEvent): void {
    NotifeeServiceClass.processNotificationAction(event);
  }
}

// Экспортируем экземпляр через статический метод getInstance
export default NotifeeServiceClass.getInstance();
