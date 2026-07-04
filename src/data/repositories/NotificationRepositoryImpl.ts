// src/data/repositories/NotificationRepositoryImpl.ts
import {
  NotificationLog,
  NotificationPayload,
  NotificationResult,
} from '@domain/entities/Notification';
import { INotificationRepository } from '@domain/repositories/INotificationRepository';
import { AxiosService, UnifiedNotificationService } from '@services';
import { Platform } from 'react-native';

export class NotificationRepositoryImpl implements INotificationRepository {
  private lastProcessedNotifications: Map<string, number> = new Map();

  // ============================================
  // 🚀 Инициализация
  // ============================================

  async initialize(): Promise<void> {
    await UnifiedNotificationService.initialize();
  }

  // ============================================
  // 📡 Подписка
  // ============================================

  subscribe(handler: (notification: NotificationPayload) => void): () => void {
    return UnifiedNotificationService.subscribe(handler);
  }

  // ============================================
  // 📝 Логирование
  // ============================================

  async logNotification(log: NotificationLog): Promise<void> {
    try {
      await AxiosService.post('/api/notifications/log', log);
    } catch (error) {
      console.error('Failed to log notification:', error);
      // Не выбрасываем ошибку, чтобы не нарушать работу приложения
    }
  }

  // ============================================
  // 🔢 Бейдж
  // ============================================

  async updateBadgeCount(count: number): Promise<void> {
    await UnifiedNotificationService.setBadgeCount(count);
  }

  async getBadgeCount(): Promise<number> {
    return UnifiedNotificationService.getBadgeCount();
  }

  // ============================================
  // 🎯 FCM
  // ============================================

  async getFCMToken(): Promise<string | null> {
    return UnifiedNotificationService.getFCMToken();
  }

  // ============================================
  // 🔄 Обработка дубликатов
  // ============================================

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

  // ============================================
  // 🎯 Обработка уведомлений (НОВЫЙ МЕТОД)
  // ============================================

  /**
   * Обработка полученного уведомления
   * @param notification - уведомление для обработки
   * @returns результат обработки
   */
  async handleNotification(notification: NotificationPayload): Promise<NotificationResult> {
    try {
      // Проверка на дубликат
      if (this.isDuplicateNotification(notification.messageId, notification.eventType)) {
        return {
          success: true,
          // Не считаем дубликат ошибкой, просто игнорируем
        };
      }

      // Логируем уведомление
      await this.logNotification({
        eventType: notification.eventType || 'unknown',
        notificationData: notification.data || {},
        platform: Platform.OS,
        appState: 'active', // Можно получать из AppState
        timestamp: new Date().toISOString(),
        additionalData: {
          messageId: notification.messageId,
          title: notification.title,
        },
      });

      // Отмечаем как обработанное
      if (notification.messageId) {
        this.markAsProcessed(notification.messageId, notification.eventType);
      }

      // Обновляем бейдж
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
