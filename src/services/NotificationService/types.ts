export interface LocalNotification {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  timestamp: number;
  type?: 'info' | 'warning' | 'error' | 'success';
  priority?: 'high' | 'normal' | 'low';
  isRead?: boolean;
  imageUrl?: string;
  platform?: 'ios' | 'android';
  fcmMessageId?: string;
}

export type NotificationPayload = {
  title?: string;
  body?: string;
  data?: Record<string, any>;
  platform?: 'ios' | 'android';
  isForeground?: boolean;
  isSilent?: boolean;
  badge?: number;
  sound?: string;
  [key: string]: any;
};

export interface LocalNotification {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  timestamp: number;
  type?: 'info' | 'warning' | 'error' | 'success';
  priority?: 'high' | 'normal' | 'low';
  isRead?: boolean;
  imageUrl?: string;
  platform?: 'ios' | 'android';
  fcmMessageId?: string;
}

export type NotificationHandler = (notification: NotificationPayload) => void;
