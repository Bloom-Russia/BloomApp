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
      return;
    }

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

    notifee.onForegroundEvent(({ type, detail }) => {
      const notificationId = detail.notification?.id;
      const eventTypeStr = this.eventTypeToString(type);

      if (this.isDuplicate(eventTypeStr, notificationId)) {
        return;
      }

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

    messaging().onMessage(async (remoteMessage) => {
      const messageId = remoteMessage.messageId;

      if (this.isDuplicate('fcm_message', messageId)) {
        return;
      }

      const payload: NotificationPayload = {
        id: messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data as Record<string, string | number | object> | undefined,
        messageId: messageId,
        eventType: 'foreground',
      };

      this.notifySubscribers(payload);

      await notifee.displayNotification({
        id: messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        android: {
          channelId: remoteMessage.data?.type === 'verification' ? 'verification' : 'default',
          smallIcon: 'ic_notification_small',
          largeIcon: 'ic_notification_large',
        },
      });
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
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

    messaging().onNotificationOpenedApp((remoteMessage) => {
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

    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
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
  }

  private notifySubscribers(notification: NotificationPayload): void {
    for (const handler of this.handlers) {
      try {
        handler(notification);
      } catch (error) {
        console.error('Ошибка в обработчике уведомлений:', error);
      }
    }
  }

  subscribe(handler: (notification: NotificationPayload) => void): () => void {
    this.handlers.push(handler);

    return () => {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  async getBadgeCount(): Promise<number> {
    try {
      const notifications = await notifee.getDisplayedNotifications();
      return notifications.length;
    } catch {
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await notifee.setBadgeCount(count);
    } catch (error) {
      console.error('Ошибка установки бейджа:', error);
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const enabled = await messaging().hasPermission();
      const hasPermission =
        enabled === messaging.AuthorizationStatus.AUTHORIZED ||
        enabled === messaging.AuthorizationStatus.PROVISIONAL;

      if (hasPermission) {
        return await messaging().getToken();
      }
      return null;
    } catch (error) {
      console.error('Ошибка получения FCM токена:', error);
      return null;
    }
  }
}

export default UnifiedNotificationService.getInstance();
