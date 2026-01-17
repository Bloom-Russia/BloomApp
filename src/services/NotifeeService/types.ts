// types.ts.ts
import { EventType, Notification, NotificationAndroid } from '@notifee/react-native';

export interface FirebaseNotificationData {
  notification?: {
    title?: string;
    body?: string;
    sound?: string;
    [key: string]: any;
  };
  data?: Record<string, any>;
  priority?: number;
  collapseKey?: string;
  from?: string;
  messageId?: string;
  originalPriority?: number;
  sentTime?: number;
  ttl?: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationPriority = 'low' | 'default' | 'high';

export interface NotifeeOptions {
  id?: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  type?: NotificationType;
  priority?: NotificationPriority;
  android?: Partial<NotificationAndroid>;
  ios?: Partial<Notification['ios']>;
  imageUrl?: string;
  actions?: Array<{
    id: string;
    title: string;
    pressAction?: {
      id: string;
    };
    input?: {
      placeholder: string;
    };
  }>;
}

// Тип для деталей события уведомления (из notifee)
export type NotificationEvent = {
  type: EventType;
  detail: any; // EventDetail из notifee
};

// Интерфейс для обработчика событий
export interface NotificationEventHandler {
  (event: NotificationEvent): void;
}

// Интерфейс для обработчика уведомлений
export interface NotificationCallback {
  (notification: Notification): void;
}

// Интерфейс для фонового обработчика
export interface BackgroundMessageHandler {
  (remoteMessage: FirebaseNotificationData): Promise<void>;
}

// Интерфейс для действия уведомления
export interface NotificationAction {
  id: string;
  title: string;
  pressAction?: { id: string };
  input?: {
    placeholder: string;
  };
}
