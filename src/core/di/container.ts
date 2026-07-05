import {
  AuthRepositoryImpl,
  NotificationRepositoryImpl,
  SecureStorageRepositoryImpl,
} from '@data/repositories';
import { NavigationService, NotificationPermissionService } from '@services';
import { AuthStore } from '@stores/AuthStore';
import { NotificationStore } from '@stores/NotificationStore';
import { RootStore } from '@stores/RootStore';

// 1. Инициализируем репозитории (Data слой)
const secureStorageRepository = new SecureStorageRepositoryImpl();
const authRepository = new AuthRepositoryImpl(secureStorageRepository);
const notificationRepository = new NotificationRepositoryImpl();

// 2. Инициализируем Stores и передаем им зависимости напрямую в конструктор
const authStore = new AuthStore(authRepository, secureStorageRepository);
const notificationStore = new NotificationStore(notificationRepository);

const rootStore = new RootStore(authStore, notificationStore);

// 3. Экспортируем готовый легковесный контейнер-объект
export const container = {
  // Репозитории
  getSecureStorageRepository: () => secureStorageRepository,
  getAuthRepository: () => authRepository,
  getNotificationRepository: () => notificationRepository,

  // Stores
  getAuthStore: () => authStore,
  getNotificationStore: () => notificationStore,
  getRootStore: () => rootStore,

  // Сервисы
  getNotificationPermissionService: () => NotificationPermissionService,
  getNavigationService: () => NavigationService,
} as const;
