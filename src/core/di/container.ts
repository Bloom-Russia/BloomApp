import { AuthStore, NotificationStore, RootStore } from '@stores';

// const secureStorageRepository = new SecureStorageRepositoryImpl();
// const authRepository = new AuthRepositoryImpl(secureStorageRepository);
// const notificationRepository = new NotificationRepositoryImpl();

// ✅ Создаем экземпляры
const authStore = new AuthStore();
const notificationStore = new NotificationStore();
const rootStore = new RootStore();

// ✅ Экспортируем контейнер
export const container = {
  getAuthStore: () => authStore,
  getNotificationStore: () => notificationStore,
  getRootStore: () => rootStore,
};
