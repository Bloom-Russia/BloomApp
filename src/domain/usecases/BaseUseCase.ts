import type { UseCaseResult } from './Result';

/**
 * Базовый интерфейс для всех Use Cases
 * @template TParams - тип параметров
 * @template TResult - тип результата (без обертки UseCaseResult)
 */
export interface IUseCase<TParams, TResult> {
  execute(params: TParams): Promise<UseCaseResult<TResult>>;
}
