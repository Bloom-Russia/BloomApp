import { NotifeeImage } from '@assets/images';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { NotificationPayload } from './types';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private isInitialized = false;

  private processedEvents = new Map<string, number>();
  private readonly DEBOUNCE_MS = 3000;
  private handlers: ((notification: NotificationPayload) => void)[] = [];

  private constructor() {}

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  private isDuplicate(eventType: string, notificationId?: string | null): boolean {
    const key = notificationId ? `${eventType}_${notificationId}` : `${eventType}_${Date.now()}`;

    const lastTime = this.processedEvents.get(key);
    const now = Date.now();

    if (lastTime && now - lastTime < this.DEBOUNCE_MS) {
      console.log(`⏭️ Дубликат игнорируется: ${key}`);
      return true;
    }

    this.processedEvents.set(key, now);
    setTimeout(() => this.processedEvents.delete(key), this.DEBOUNCE_MS);
    return false;
  }

  private eventTypeToString(eventType: EventType): string {
    switch (eventType) {
      case EventType.PRESS:
        return 'press';
      case EventType.ACTION_PRESS:
        return 'action_press';
      case EventType.DISMISSED:
        return 'dismissed';
      case EventType.DELIVERED:
        return 'delivered';
      default:
        return String(eventType);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ UnifiedNotificationService уже инициализирован');
      return;
    }

    console.log('🚀 Инициализация UnifiedNotificationService...');

    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Основные уведомления',
        importance: AndroidImportance.HIGH,
      });
      await notifee.createChannel({
        id: 'verification',
        name: 'Код подтверждения',
        importance: AndroidImportance.HIGH,
      });
      await notifee.createChannel({
        id: 'alerts',
        name: 'Важные уведомления',
        importance: AndroidImportance.HIGH,
      });
    }

    // Единственный обработчик Notifee
    notifee.onForegroundEvent(({ type, detail }) => {
      const notificationId = detail.notification?.id;
      const eventTypeStr = this.eventTypeToString(type);

      if (this.isDuplicate(eventTypeStr, notificationId)) {
        return;
      }

      console.log(`📱 Событие Notifee: ${eventTypeStr}, ID: ${notificationId}`);

      const payload: NotificationPayload = {
        id: notificationId,
        title: detail.notification?.title,
        body: detail.notification?.body,
        data: detail.notification?.data as Record<string, string | number | object> | undefined,
        messageId: notificationId,
        eventType: eventTypeStr,
      };

      this.notifySubscribers(payload);
    });

    // Единственный обработчик FCM
    messaging().onMessage(async (remoteMessage) => {
      const messageId = remoteMessage.messageId;

      if (this.isDuplicate('fcm_message', messageId)) {
        return;
      }

      console.log(`📨 FCM сообщение в foreground: ${messageId}`);

      const payload: NotificationPayload = {
        id: messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data as Record<string, string | number | object> | undefined,
        messageId: messageId,
        eventType: 'foreground',
      };

      this.notifySubscribers(payload);

      // Показываем уведомление через Notifee
      await notifee.displayNotification({
        id: messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        android: {
          channelId: remoteMessage.data?.type === 'verification' ? 'verification' : 'default',
          largeIcon: NotifeeImage,
        },
      });
    });

    // Фоновый обработчик
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log(`📨 Фоновое сообщение: ${remoteMessage.messageId}`);

      const payload: NotificationPayload = {
        id: remoteMessage.messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data as Record<string, string | number | object> | undefined,
        messageId: remoteMessage.messageId,
        eventType: 'background',
      };

      this.notifySubscribers(payload);
    });

    // Обработчик открытия по уведомлению
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(`📱 Открыто по уведомлению: ${remoteMessage.messageId}`);

      const payload: NotificationPayload = {
        id: remoteMessage.messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data as Record<string, string | number | object> | undefined,
        messageId: remoteMessage.messageId,
        eventType: 'open',
      };

      this.notifySubscribers(payload);
    });

    // Initial notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log(`🚀 Initial notification: ${initialNotification.messageId}`);

      const payload: NotificationPayload = {
        id: initialNotification.messageId,
        title: initialNotification.notification?.title,
        body: initialNotification.notification?.body,
        data: initialNotification.data as Record<string, string | number | object> | undefined,
        messageId: initialNotification.messageId,
        eventType: 'initial',
      };

      this.notifySubscribers(payload);
    }

    this.isInitialized = true;
    console.log('✅ UnifiedNotificationService успешно инициализирован');
  }

  private notifySubscribers(notification: NotificationPayload): void {
    this.handlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Ошибка в обработчике уведомлений:', error);
      }
    });
  }

  /**
   * Подписка на уведомления
   */
  subscribe(handler: (notification: NotificationPayload) => void): () => void {
    this.handlers.push(handler);
    console.log(`📌 Подписчик добавлен. Всего: ${this.handlers.length}`);

    return () => {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
        console.log(`📌 Подписчик удален. Осталось: ${this.handlers.length}`);
      }
    };
  }

  /**
   * Получение количества бейджей (непрочитанных уведомлений)
   */
  async getBadgeCount(): Promise<number> {
    try {
      const notifications = await notifee.getDisplayedNotifications();
      return notifications.length;
    } catch (error) {
      console.error('Ошибка получения количества уведомлений:', error);
      return 0;
    }
  }

  /**
   * Установка количества бейджей
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await notifee.setBadgeCount(count);
      console.log(`Бейдж установлен: ${count}`);
    } catch (error) {
      console.error('Ошибка установки бейджа:', error);
    }
  }

  /**
   * Получение FCM токена
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const enabled = await messaging().hasPermission();
      const hasPermission =
        enabled === messaging.AuthorizationStatus.AUTHORIZED ||
        enabled === messaging.AuthorizationStatus.PROVISIONAL;

      if (hasPermission) {
        const token = await messaging().getToken();
        if (token && token.length > 0) {
          console.log(`📱 Получен FCM токен: ${token.substring(0, 20)}...`);
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Ошибка получения FCM токена:', error);
      return null;
    }
  }
}

export default UnifiedNotificationService.getInstance();
