import { NotificationLog, NotificationPayload, NotificationResult } from '../entities';

export interface INotificationRepository {
  // Инициализация
  initialize(): Promise<void>;

  // Подписка
  subscribe(handler: (notification: NotificationPayload) => void): () => void;

  // Логирование
  logNotification(log: NotificationLog): Promise<void>;

  // Бейдж
  updateBadgeCount(count: number): Promise<void>;
  getBadgeCount(): Promise<number>;

  // FCM
  getFCMToken(): Promise<string | null>;

  // Дубликаты
  isDuplicateNotification(notificationId?: string, eventType?: string): boolean;
  markAsProcessed(notificationId: string, eventType?: string): void;

  // Обработка
  handleNotification(notification: NotificationPayload): Promise<NotificationResult>;
}
