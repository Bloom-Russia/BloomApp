import { AuthStore, NotificationStore, RootStore } from '@stores';

const authStore = new AuthStore();
const notificationStore = new NotificationStore();
const rootStore = new RootStore();

export const container = {
  getAuthStore: () => authStore,
  getNotificationStore: () => notificationStore,
  getRootStore: () => rootStore,
};
