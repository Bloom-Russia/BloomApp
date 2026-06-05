import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  messageId: string;
  platform?: 'ios' | 'android';
  isForeground?: boolean;
  isSilent?: boolean;
  badge?: number;
  sound?: string;
}

// Тип для нативных событий iOS
export interface IOSNotificationData {
  data?: Record<string, unknown>;
  notification?: Record<string, unknown>;
  messageId?: string;
  badge?: number;
  sound?: string | { name: string };
  isSilent?: boolean;
  type?: string;
}

// Тип для деталей уведомления от Notifee
export interface NotifeeNotificationDetail {
  notification?: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  };
  pressAction?: {
    id: string;
  };
}

// Интерфейс для расширенного notification с полем sound
export interface ExtendedNotification extends FirebaseMessagingTypes.Notification {
  sound?: string;
}

export type NotificationHandler = (notification: NotificationPayload) => void;
