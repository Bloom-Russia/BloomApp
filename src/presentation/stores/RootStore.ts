// src/presentation/stores/RootStore.ts
import { AuthStore } from './AuthStore';
import { NotificationStore } from './NotificationStore';

export class RootStore {
  authStore: AuthStore;
  notificationStore: NotificationStore;

  constructor() {
    this.authStore = new AuthStore();
    this.notificationStore = new NotificationStore();
  }

  async initialize(): Promise<void> {
    await this.notificationStore.initialize();
    // Пока убираем loadAuthStatus
  }
}
