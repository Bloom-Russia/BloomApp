/**
 * Стандартный результат выполнения Use Case
 */
export class UseCaseResult<T> {
  constructor(
    public readonly data: T | null = null,
    public readonly error: Error | null = null,
    public readonly isSuccess: boolean = false
  ) {}

  static success<T>(data: T): UseCaseResult<T> {
    return new UseCaseResult<T>(data, null, true);
  }

  static failure<T>(error: Error): UseCaseResult<T> {
    return new UseCaseResult<T>(null, error, false);
  }
}
