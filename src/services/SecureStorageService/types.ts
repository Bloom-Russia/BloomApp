// types.ts.ts
import { ACCESSIBLE } from 'react-native-keychain';

/**
 * Опции конфигурации безопасного хранилища
 */
export interface SecureStorageOptions {
  /** Уровень доступности данных (см. ACCESSIBLE из react-native-keychain) */
  accessible?: ACCESSIBLE;
  /** Идентификатор сервиса для группировки данных */
  service?: string;
}

/**
 * Результат операции с безопасным хранилищем
 * @template T - Тип возвращаемых данных
 */
export interface SecureStorageResult<T = boolean> {
  /** Успешность операции */
  success: boolean;
  /** Данные (опционально) */
  data?: T;
  /** Ошибка (опционально) */
  error?: Error | unknown;
}

/**
 * Токены аутентификации
 */
export interface Tokens {
  /** Access токен для авторизации */
  accessToken: string | null;
  /** Refresh токен для обновления */
  refreshToken: string | null;
}
