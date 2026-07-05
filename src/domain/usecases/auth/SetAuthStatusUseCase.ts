import { IAuthRepository } from '../../repositories';
import { IUseCase } from '../BaseUseCase';
import { UseCaseResult } from '../Result';

export class SetAuthStatusUseCase implements IUseCase<{ isVerified: boolean }, void> {
  constructor(private authRepository: IAuthRepository) {}

  async execute(params: { isVerified: boolean }): Promise<UseCaseResult<void>> {
    try {
      await this.authRepository.setAuthStatus(params.isVerified);
      return UseCaseResult.success(undefined);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return UseCaseResult.failure(errorObj);
    }
  }
}
