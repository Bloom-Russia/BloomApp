import type { INotificationRepository, NotificationPayload } from '@domain';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

export class NotificationStore {
  /** Последнее полученное уведомление */
  lastNotification: NotificationPayload | null = null;

  /** История уведомлений */
  notifications: NotificationPayload[] = [];

  /** Индикатор обработки */
  isProcessing: boolean = false;

  /** Ошибка */
  error: string | null = null;

  /** Количество непрочитанных уведомлений */
  badgeCount: number = 0;

  private notificationRepository: INotificationRepository;
  private unsubscribe: (() => void) | null = null;

  constructor(notificationRepository: INotificationRepository) {
    this.notificationRepository = notificationRepository;
    this.unsubscribe = null;

    // ✅ Явное указание всех полей для makeObservable
    makeObservable(this, {
      // observable поля
      lastNotification: observable,
      notifications: observable,
      isProcessing: observable,
      error: observable,
      badgeCount: observable,

      // actions
      initialize: action,
      handleNotification: action,
      loadBadgeCount: action,
      resetBadgeCount: action,
      clearLastNotification: action,
      clearNotifications: action,
      resetState: action,
      cleanup: action,

      // computed
      unreadCount: computed,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.notificationRepository.initialize();
      this.unsubscribe = this.notificationRepository.subscribe(this.handleNotification);
      await this.loadBadgeCount();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async handleNotification(notification: NotificationPayload): Promise<void> {
    if (this.isDuplicatePrivate(notification)) {
      return;
    }

    runInAction(() => {
      this.isProcessing = true;
      this.lastNotification = notification;
      this.notifications.unshift(notification);
    });

    try {
      await this.notificationRepository.logNotification({
        eventType: notification.eventType || 'unknown',
        notificationData: {
          title: notification.title,
          messageId: notification.messageId,
          hasData: !!notification.data,
        },
        platform: 'mobile',
        appState: 'active',
        timestamp: new Date().toISOString(),
      });

      await this.loadBadgeCount();

      runInAction(() => {
        this.isProcessing = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.isProcessing = false;
        this.error = error instanceof Error ? error.message : 'Failed to process notification';
      });
    }
  }

  async getBadgeCount(): Promise<number> {
    return this.notificationRepository.getBadgeCount();
  }

  async updateBadgeCount(count: number): Promise<void> {
    await this.notificationRepository.updateBadgeCount(count);
    runInAction(() => {
      this.badgeCount = count;
    });
  }

  isDuplicateNotification(notificationId?: string, eventType?: string): boolean {
    return this.notificationRepository.isDuplicateNotification(notificationId, eventType);
  }

  markAsProcessed(notificationId: string, eventType?: string): void {
    this.notificationRepository.markAsProcessed(notificationId, eventType);
  }

  async getFCMToken(): Promise<string | null> {
    return this.notificationRepository.getFCMToken();
  }

  async loadBadgeCount(): Promise<void> {
    try {
      const count = await this.notificationRepository.getBadgeCount();
      runInAction(() => {
        this.badgeCount = count;
      });
    } catch (error) {
      console.error('Failed to load badge count:', error);
    }
  }

  async resetBadgeCount(): Promise<void> {
    try {
      await this.notificationRepository.updateBadgeCount(0);
      runInAction(() => {
        this.badgeCount = 0;
      });
    } catch (error) {
      console.error('Failed to reset badge count:', error);
    }
  }

  clearLastNotification(): void {
    this.lastNotification = null;
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  resetState(): void {
    this.lastNotification = null;
    this.isProcessing = false;
    this.error = null;
    this.badgeCount = 0;
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private isDuplicatePrivate(notification: NotificationPayload): boolean {
    if (!notification.messageId) {
      return false;
    }
    return this.notifications.some((n) => n.messageId === notification.messageId);
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.data?.read).length;
  }
}
