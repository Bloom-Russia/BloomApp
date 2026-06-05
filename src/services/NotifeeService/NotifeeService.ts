import notifee, {
  type AndroidAction,
  type AndroidChannel,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type IOSInput,
  type Notification,
  type NotificationSettings,
} from '@notifee/react-native';
import { Platform } from 'react-native';
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
  private static instance: NotifeeServiceClass | null = null;
  private channelIds: Map<string, string> = new Map();
  private notificationHandlers: NotificationCallback[] = [];
  private eventHandlers: NotificationEventHandler[] = [];
  private backgroundMessageHandler?: BackgroundMessageHandler;
  private lastNotificationShownTime: Map<string, number> = new Map();

  /**
   * Приватный конструктор для Singleton
   */
  private constructor() {
    // Инициализация будет вызываться через initializeService
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

      // Слушаем события уведомлений
      this.setupEventListeners();

      console.log('Сервис уведомлений успешно инициализирован');
    } catch (error: unknown) {
      console.error('Ошибка инициализации сервиса уведомлений:', error);
      throw error;
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
      console.log('Получено фоновое сообщение:', remoteMessage.messageId);

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

    // Безопасное извлечение заголовка и текста
    const title =
      notification?.title ||
      (typeof data?.title === 'string' ? (data.title as string) : 'Уведомление');

    const body =
      notification?.body || (typeof data?.body === 'string' ? (data.body as string) : '');

    const options: NotifeeOptions = {
      title,
      body,
      data: data ? this.cleanNotificationData(data) : {},
      priority: this.getPriorityFromFirebase(remoteMessage.priority),
    };

    // Добавляем дополнительные настройки для iOS
    if (Platform.OS === 'ios') {
      options.ios = {
        sound: 'default',
        critical: remoteMessage.priority === 2,
      };
    }

    return this.showNotification(options);
  }

  /**
   * Очистка данных уведомления от undefined значений
   */
  private cleanNotificationData(
    data: Record<string, unknown>,
  ): Record<string, string | number | object> {
    const cleanData: Record<string, string | number | object> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'object') {
          cleanData[key] = value as string | number | object;
        } else {
          // Преобразуем другие типы в строку
          cleanData[key] = String(value);
        }
      }
    });

    return cleanData;
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
   * Проверка дедупликации уведомлений
   */
  private shouldShowNotification(
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): boolean {
    try {
      // Создаем ключ дедупликации
      const dataMessageId = data.messageId as string | undefined;
      const dataNotificationId = data.notificationId as string | undefined;

      const dedupeKey =
        dataMessageId || dataNotificationId || `${title}_${body}_${JSON.stringify(data)}`;

      const currentTime = Date.now();
      const lastShownTime = this.lastNotificationShownTime.get(dedupeKey);

      // Если такое уведомление показывалось менее 5 секунд назад - пропускаем
      if (lastShownTime && currentTime - lastShownTime < 5000) {
        console.log(
          `⚠️ Дедупликация: уведомление "${title}" уже показывалось ${
            currentTime - lastShownTime
          }мс назад`,
        );
        return false;
      }

      // Сохраняем время показа
      this.lastNotificationShownTime.set(dedupeKey, currentTime);

      // Ограничиваем размер Map (очищаем старые записи)
      if (this.lastNotificationShownTime.size > 100) {
        const oldestKey = this.lastNotificationShownTime.keys().next().value;
        if (typeof oldestKey === 'string') {
          this.lastNotificationShownTime.delete(oldestKey);
        }
      }

      return true;
    } catch (error) {
      console.error('Ошибка дедупликации уведомления:', error);
      return true;
    }
  }

  /**
   * Показать уведомление с дедупликацией
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

      // Проверка дедупликации
      if (!this.shouldShowNotification(title, body, data)) {
        console.log(`⚠️ Уведомление "${title}" пропущено из-за дедупликации`);
        return `deduped_${Date.now()}`;
      }

      // Получаем channelId (только для Android)
      const channelId = this.getChannelIdByType(type, priority);

      // Создаем data объект с правильной типизацией
      const notificationData: Record<string, string | number | object> = {
        timestamp: Date.now().toString(),
        platform: Platform.OS,
        ...this.cleanNotificationData(data),
      };

      // Базовое уведомление
      const notification: Notification = {
        id: id || `${Date.now()}-${Math.random()}`,
        title,
        body,
        data: notificationData,
        android: {
          channelId,
          importance: this.getAndroidImportance(priority),
          pressAction: { id: 'default' },
          smallIcon: 'notification_icon',
          largeIcon: 'logo_large',
          color: '#000000',
          circularLargeIcon: true,
          colorized: true,
          visibility: AndroidVisibility.PUBLIC,
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
          threadId: `thread_${type}`,
          summaryArgument: title,
          ...ios,
        },
      };

      // Если переданы кастомные настройки Android, применяем их
      if (android.smallIcon && notification.android) {
        notification.android.smallIcon = android.smallIcon;
      }

      if (android.largeIcon && notification.android) {
        notification.android.largeIcon = android.largeIcon;
      }

      if (android.color && notification.android) {
        notification.android.color = android.color;
      }

      if (android.circularLargeIcon !== undefined && notification.android) {
        notification.android.circularLargeIcon = android.circularLargeIcon;
      }

      // Добавление изображения
      if (imageUrl) {
        if (Platform.OS === 'ios') {
          notification.ios = {
            ...notification.ios,
            attachments: [{ url: imageUrl }],
          };
        } else if (notification.android) {
          notification.android.largeIcon = imageUrl;
        }
      }

      // Добавление действий (кнопок) в уведомление
      if (actions.length > 0) {
        if (Platform.OS === 'ios') {
          notification.ios = {
            ...notification.ios,
            categoryId: 'CUSTOM_ACTIONS',
          };
        } else if (notification.android) {
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
   * Получение количества отображенных уведомлений
   */
  public async getDisplayedNotificationsCount(): Promise<number> {
    try {
      const displayedNotifications = await notifee.getDisplayedNotifications();
      return displayedNotifications.length;
    } catch (error: unknown) {
      console.error('Ошибка получения количества отображенных уведомлений:', error);
      return 0;
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
    this.notifyEventSubscribers(event);

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

    if (notification?.data?.screen) {
      console.log('Переход на экран:', notification.data.screen);
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
        break;

      case 'save':
        console.log('Сохраняем:', notification?.data);
        break;

      case 'reply': {
        const userInput = (event.detail.input as { value?: string })?.value;
        console.log('Пользователь ответил:', userInput);
        break;
      }

      case 'view':
        console.log('Просмотр:', notification?.data);
        break;

      case 'dismiss':
        console.log('Уведомление отклонено пользователем');
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
}

// Экспортируем экземпляр через статический метод getInstance
export default NotifeeServiceClass.getInstance();
