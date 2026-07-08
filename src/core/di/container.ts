import { AuthStore, RootStore } from '@stores';

const authStore = new AuthStore();
const rootStore = new RootStore();

export const container = {
  getAuthStore: () => authStore,
  getRootStore: () => rootStore,
};
