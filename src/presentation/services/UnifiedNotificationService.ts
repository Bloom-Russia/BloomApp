import { container } from '@core/di/container'; // Импортируем наш центральный DI-контейнер
import { NotificationPayload } from '@domain/entities/Notification';

const UnifiedNotificationService = {
  // Динамически берем единственный созданный в приложении экземпляр репозитория при вызове каждого метода
  initialize: () => container.getNotificationRepository().initialize(),

  subscribe: (handler: (notification: NotificationPayload) => void) =>
    container.getNotificationRepository().subscribe(handler),

  getFCMToken: () => container.getNotificationRepository().getFCMToken(),

  getBadgeCount: () => container.getNotificationRepository().getBadgeCount(),

  setBadgeCount: (count: number) => container.getNotificationRepository().updateBadgeCount(count),
};

export default UnifiedNotificationService;

export type { NotificationPayload };
