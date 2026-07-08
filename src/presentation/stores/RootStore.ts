import { AuthStore } from './AuthStore';

export class RootStore {
  authStore: AuthStore;

  constructor() {
    this.authStore = new AuthStore();
  }

  async initialize(): Promise<void> {
    // Пока убираем loadAuthStatus
  }
}
