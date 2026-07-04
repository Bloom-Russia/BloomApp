// Обертка для обратной совместимости
import { NotificationRepositoryImpl } from '@data/repositories/NotificationRepositoryImpl';
import { NotificationPayload } from '@domain/entities/Notification';

// Создаем синглтон репозитория
const repository = new NotificationRepositoryImpl();

// Экспортируем тот же интерфейс, что был раньше
const UnifiedNotificationService = {
  initialize: () => repository.initialize(),
  subscribe: (handler: (notification: NotificationPayload) => void) =>
    repository.subscribe(handler),
  getFCMToken: () => repository.getFCMToken(),
  getBadgeCount: () => repository.getBadgeCount(),
  setBadgeCount: (count: number) => repository.updateBadgeCount(count),
};

export default UnifiedNotificationService;

// Экспорт типов для совместимости
export type { NotificationPayload };
