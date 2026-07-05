import { IAuthRepository } from '../../repositories';
import { IUseCase } from '../BaseUseCase';
import { UseCaseResult } from '../Result';

export class CheckAuthStatusUseCase implements IUseCase<void, { isVerified: boolean }> {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<UseCaseResult<{ isVerified: boolean }>> {
    try {
      const status = await this.authRepository.getAuthStatus();
      return UseCaseResult.success(status);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return UseCaseResult.failure(errorObj);
    }
  }
}
