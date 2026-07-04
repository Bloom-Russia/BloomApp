// src/domain/repositories/INotificationRepository.ts
import { NotificationLog, NotificationPayload, NotificationResult } from '../entities/Notification';

export interface INotificationRepository {
  // ===== Инициализация =====
  initialize(): Promise<void>;

  // ===== Подписка =====
  subscribe(handler: (notification: NotificationPayload) => void): () => void;

  // ===== Логирование =====
  logNotification(log: NotificationLog): Promise<void>;

  // ===== Бейдж =====
  updateBadgeCount(count: number): Promise<void>;
  getBadgeCount(): Promise<number>;

  // ===== FCM =====
  getFCMToken(): Promise<string | null>;

  // ===== Обработка дубликатов =====
  isDuplicateNotification(notificationId?: string, eventType?: string): boolean;
  markAsProcessed(notificationId: string, eventType?: string): void;

  // ===== Обработка уведомлений =====
  handleNotification(notification: NotificationPayload): Promise<NotificationResult>;
}
