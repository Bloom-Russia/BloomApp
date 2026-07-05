import AuthStore from './AuthStore';
import { NotificationStore } from './NotificationStore';

export class RootStore {
  authStore: AuthStore;
  notificationStore: NotificationStore;

  constructor(authStore: AuthStore, notificationStore: NotificationStore) {
    this.authStore = authStore;
    this.notificationStore = notificationStore;
  }

  /**
   * Инициализация всех Stores при старте приложения
   */
  async initialize(): Promise<void> {
    // Инициализация NotificationStore (подписка на уведомления)
    await this.notificationStore.initialize();

    // AuthStore инициализируется автоматически в конструкторе
    // (loadAuthStatus вызывается при создании)
  }

  /**
   * Очистка всех Stores при выходе из приложения
   */
  cleanup(): void {
    this.notificationStore.cleanup();
    this.authStore.resetState();
  }
}
