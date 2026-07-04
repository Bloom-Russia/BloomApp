import { injectable } from 'inversify';
import { AuthStore } from './AuthStore';
import { NotificationStore } from './NotificationStore';

@injectable()
export class RootStore {
  authStore: AuthStore;
  notificationStore: NotificationStore;

  constructor(authStore: AuthStore, notificationStore: NotificationStore) {
    this.authStore = authStore;
    this.notificationStore = notificationStore;
  }
}
