import { NotificationLog } from '@domain/entities/Notification';
import { INotificationRepository } from '@domain/repositories/INotificationRepository';
import { IUseCase } from '../BaseUseCase';
import { UseCaseResult } from '../Result';

export class LogNotificationUseCase implements IUseCase<NotificationLog, void> {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(params: NotificationLog): Promise<UseCaseResult<void>> {
    try {
      await this.notificationRepository.logNotification(params);
      return UseCaseResult.success(undefined);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return UseCaseResult.failure(errorObj);
    }
  }
}
