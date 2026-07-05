// src/presentation/stores/NotificationStore.ts
import { NotificationPayload } from '@domain';
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

  /** Флаг инициализации */
  isInitialized: boolean = false;

  private unsubscribe: (() => void) | null = null;

  constructor() {
    makeObservable(this, {
      lastNotification: observable,
      notifications: observable,
      isProcessing: observable,
      error: observable,
      badgeCount: observable,
      isInitialized: observable,

      initialize: action,
      handleNotification: action,
      loadBadgeCount: action,
      resetBadgeCount: action,
      clearLastNotification: action,
      clearNotifications: action,
      resetState: action,
      cleanup: action,

      unreadCount: computed,
      hasUnread: computed,
    });
  }

  /**
   * Инициализация сервиса уведомлений
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[NotificationStore] Initialized');

      // ✅ Симулируем подписку на уведомления
      this.unsubscribe = this.simulateSubscription();

      runInAction(() => {
        this.isInitialized = true;
        this.badgeCount = 0;
      });

      // ✅ Тестовое уведомление через 5 секунд
      setTimeout(() => {
        this.handleNotification({
          id: 'test-1',
          title: 'Тестовое уведомление',
          body: 'Привет из NotificationStore!',
          messageId: 'test-msg-1',
          eventType: 'foreground',
          data: { test: true },
          timestamp: new Date(),
        });
      }, 5000);
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to initialize';
      });
      console.error('[NotificationStore] Init error:', error);
    }
  }

  /**
   * Симуляция подписки на уведомления
   */
  private simulateSubscription(): () => void {
    console.log('[NotificationStore] Subscribed to notifications');

    // ✅ Возвращаем функцию отписки
    return () => {
      console.log('[NotificationStore] Unsubscribed from notifications');
    };
  }

  /**
   * Обработка полученного уведомления
   */
  async handleNotification(notification: NotificationPayload): Promise<void> {
    // Проверка на дубликат
    if (this.isDuplicate(notification)) {
      console.log('[NotificationStore] Duplicate notification ignored:', notification.messageId);
      return;
    }

    const notificationWithRead = {
      ...notification,
      read: false,
      timestamp: notification.timestamp || new Date(),
    };

    runInAction(() => {
      this.isProcessing = true;
      this.lastNotification = notificationWithRead;
      this.notifications.unshift(notificationWithRead);
      this.badgeCount += 1;
    });

    try {
      // ✅ Симулируем отправку лога
      console.log('[NotificationStore] Notification processed:', notificationWithRead);

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

  /**
   * Получение количества уведомлений (бейдж)
   */
  async getBadgeCount(): Promise<number> {
    return this.badgeCount;
  }

  /**
   * Обновление количества уведомлений (бейдж)
   */
  async updateBadgeCount(count: number): Promise<void> {
    runInAction(() => {
      this.badgeCount = count;
    });
  }

  /**
   * Загрузка количества уведомлений
   */
  async loadBadgeCount(): Promise<void> {
    // ✅ Симулируем загрузку с сервера
    runInAction(() => {
      this.badgeCount = this.notifications.filter((n) => !n.read).length;
    });
  }

  /**
   * Сброс счетчика уведомлений
   */
  async resetBadgeCount(): Promise<void> {
    await this.updateBadgeCount(0);
  }

  /**
   * Очистка последнего уведомления
   */
  clearLastNotification(): void {
    runInAction(() => {
      this.lastNotification = null;
    });
  }

  /**
   * Очистка всех уведомлений
   */
  clearNotifications(): void {
    runInAction(() => {
      this.notifications = [];
      this.badgeCount = 0;
    });
  }

  /**
   * Отметить все уведомления как прочитанные
   */
  markAllAsRead(): void {
    runInAction(() => {
      this.notifications = this.notifications.map((n) => ({
        ...n,
        read: true,
      }));
      this.badgeCount = 0;
    });
  }

  /**
   * Отметить уведомление как прочитанное по id
   */
  markAsRead(id: string): void {
    runInAction(() => {
      this.notifications = this.notifications.map((n) => {
        if (n.id === id || n.messageId === id) {
          return { ...n, read: true };
        }
        return n;
      });
      this.badgeCount = this.notifications.filter((n) => !n.read).length;
    });
  }

  /**
   * Сброс состояния
   */
  resetState(): void {
    runInAction(() => {
      this.lastNotification = null;
      this.isProcessing = false;
      this.error = null;
      this.badgeCount = 0;
    });
  }

  /**
   * Очистка подписки
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Проверка на дубликат уведомления
   */
  private isDuplicate(notification: NotificationPayload): boolean {
    if (!notification.messageId) {
      return false;
    }
    return this.notifications.some((n) => n.messageId === notification.messageId);
  }

  // ============================================
  // 💡 COMPUTED PROPERTIES
  // ============================================

  /**
   * Количество непрочитанных уведомлений
   */
  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Есть ли непрочитанные уведомления
   */
  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }

  /**
   * Последние 5 уведомлений
   */
  get recentNotifications(): NotificationPayload[] {
    return this.notifications.slice(0, 5);
  }
}
