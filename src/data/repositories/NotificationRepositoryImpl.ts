import {
  NotificationLog,
  NotificationPayload,
  NotificationResult,
} from '@domain/entities/Notification';
import { INotificationRepository } from '@domain/repositories';
import { AxiosService, UnifiedNotificationService } from '@services';
import { Platform } from 'react-native';

export class NotificationRepositoryImpl implements INotificationRepository {
  private lastProcessedNotifications: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    await UnifiedNotificationService.initialize();
  }

  subscribe(handler: (notification: NotificationPayload) => void): () => void {
    return UnifiedNotificationService.subscribe(handler);
  }

  async logNotification(log: NotificationLog): Promise<void> {
    try {
      await AxiosService.post('/api/notifications/log', log);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  async updateBadgeCount(count: number): Promise<void> {
    await UnifiedNotificationService.setBadgeCount(count);
  }

  async getBadgeCount(): Promise<number> {
    return UnifiedNotificationService.getBadgeCount();
  }

  async getFCMToken(): Promise<string | null> {
    return UnifiedNotificationService.getFCMToken();
  }

  isDuplicateNotification(notificationId?: string, eventType?: string): boolean {
    if (!notificationId) {
      return false;
    }

    const key = `${eventType || 'unknown'}_${notificationId}`;
    const now = Date.now();
    const lastTime = this.lastProcessedNotifications.get(key);

    if (lastTime && now - lastTime < 2000) {
      return true;
    }

    this.lastProcessedNotifications.set(key, now);
    setTimeout(() => {
      this.lastProcessedNotifications.delete(key);
    }, 2000);

    return false;
  }

  markAsProcessed(notificationId: string, eventType?: string): void {
    const key = `${eventType || 'unknown'}_${notificationId}`;
    this.lastProcessedNotifications.set(key, Date.now());
  }

  /**
   * Обработка полученного уведомления
   * @param notification - уведомление для обработки
   * @returns результат обработки
   */
  async handleNotification(notification: NotificationPayload): Promise<NotificationResult> {
    try {
      if (this.isDuplicateNotification(notification.messageId, notification.eventType)) {
        return { success: true };
      }

      // ✅ Безопасное извлечение данных
      const notificationData = notification.data || {};

      await this.logNotification({
        eventType: notification.eventType || 'unknown',
        notificationData: notificationData,
        platform: Platform.OS,
        appState: 'active',
        timestamp: new Date().toISOString(),
        additionalData: {
          messageId: notification.messageId || undefined,
          title: notification.title || undefined,
        },
      });

      if (notification.messageId) {
        this.markAsProcessed(notification.messageId, notification.eventType);
      }

      const currentCount = await this.getBadgeCount();
      await this.updateBadgeCount(currentCount + 1);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }
}
