import { NotificationRepositoryImpl } from '@data/repositories/NotificationRepositoryImpl';
import { NotificationPayload } from '@domain/entities/Notification';

const repository = new NotificationRepositoryImpl();

const UnifiedNotificationService = {
  initialize: () => repository.initialize(),
  subscribe: (handler: (notification: NotificationPayload) => void) =>
    repository.subscribe(handler),
  getFCMToken: () => repository.getFCMToken(),
  getBadgeCount: () => repository.getBadgeCount(),
  setBadgeCount: (count: number) => repository.updateBadgeCount(count),
};

export default UnifiedNotificationService;

export type { NotificationPayload };
