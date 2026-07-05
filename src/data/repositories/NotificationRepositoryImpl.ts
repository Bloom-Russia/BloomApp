import { NotificationPayload } from '@domain';
import { Platform } from 'react-native';

export class NotificationRepositoryImpl {
  private lastProcessedNotifications: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    console.log('[NotificationRepository] Initialized');
  }

  subscribe(handler: (notification: NotificationPayload) => void): () => void {
    console.log('[NotificationRepository] Subscribed');

    // Тестовое уведомление через 5 секунд
    setTimeout(() => {
      const testNotification: NotificationPayload = {
        id: 'test-1',
        title: 'Тестовое уведомление',
        body: 'Привет из репозитория!',
        messageId: 'test-msg-1',
        eventType: 'foreground',
        data: { test: true },
      };
      handler(testNotification);
    }, 5000);

    return () => {
      console.log('[NotificationRepository] Unsubscribed');
    };
  }

  async logNotification(log: any): Promise<void> {
    console.log('[NotificationRepository] Log:', log);
  }

  async updateBadgeCount(count: number): Promise<void> {
    console.log('[NotificationRepository] Badge count:', count);
  }

  async getBadgeCount(): Promise<number> {
    return 0;
  }

  async getFCMToken(): Promise<string | null> {
    return null;
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

  async handleNotification(
    notification: NotificationPayload,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      if (this.isDuplicateNotification(notification.messageId, notification.eventType)) {
        return { success: true };
      }

      await this.logNotification({
        eventType: notification.eventType || 'unknown',
        notificationData: notification.data || {},
        platform: Platform.OS,
        appState: 'active',
        timestamp: new Date().toISOString(),
        additionalData: {
          messageId: notification.messageId,
          title: notification.title,
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
