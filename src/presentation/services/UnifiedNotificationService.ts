import { container } from '@core/di/container';
import { NotificationPayload } from '@domain';

export const UnifiedNotificationService = {
  initialize: () => container.getNotificationRepository().initialize(),
  subscribe: (handler: (notification: NotificationPayload) => void) =>
    container.getNotificationRepository().subscribe(handler),
  getFCMToken: () => container.getNotificationRepository().getFCMToken(),
  getBadgeCount: () => container.getNotificationRepository().getBadgeCount(),
  setBadgeCount: (count: number) => container.getNotificationRepository().updateBadgeCount(count),
};
