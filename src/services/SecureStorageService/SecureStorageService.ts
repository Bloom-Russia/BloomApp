// SecureStorageService.ts
import { ACCESSIBLE } from 'react-native-keychain';
import { SecureStorageKeys } from './SecureStorageKeys';
import { SecureStorageOptions, SecureStorageResult, Tokens } from './types';

/**
 * Сервис для работы с безопасным хранилищем на устройстве.
 * Использует react-native-keychain под капотом для безопасного хранения данных.
 * Реализует паттерн Singleton для единого доступа к хранилищу.
 */
class SecureStorageService {
  /** Единственный экземпляр класса (Singleton) */
  private static instance: SecureStorageService;

  /** Текущие опции конфигурации */
  private options: Required<SecureStorageOptions>;

  /**
   * Конфигурация по умолчанию для безопасного хранилища
   * @private
   */
  private defaultOptions: Required<SecureStorageOptions> = {
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: 'com.app.tokens',
  };

  /**
   * Приватный конструктор для реализации паттерна Singleton
   * @param options - Опции конфигурации хранилища
   * @private
   */
  private constructor(options?: Partial<SecureStorageOptions>) {
    this.options = { ...this.defaultOptions, ...options } as Required<SecureStorageOptions>;
  }

  /**
   * Обновление опций после создания экземпляра
   * @param options - Новые опции конфигурации
   * @private
   */
  private updateOptions(options: Partial<SecureStorageOptions>): void {
    this.options = { ...this.options, ...options } as Required<SecureStorageOptions>;
  }

  /**
   * Получение экземпляра SecureStorageService (Singleton)
   * @param options - Опции конфигурации
   * @returns Единственный экземпляр сервиса
   */
  public static getInstance(options?: Partial<SecureStorageOptions>): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService(options);
    } else if (options) {
      // Обновляем опции, если instance уже существует
      SecureStorageService.instance.updateOptions(options);
    }
    return SecureStorageService.instance;
  }

  // ===== ОСНОВНЫЕ МЕТОДЫ =====

  /**
   * Сохранение значения в защищенное хранилище
   * @param key - Ключ для сохранения
   * @param value - Значение для сохранения
   */
  public async saveValue(
    key: string | SecureStorageKeys,
    value?: string | null | number | boolean,
  ): Promise<SecureStorageResult> {
    return this.instanceSaveValue(key, value);
  }

  /**
   * Получение значения из защищенного хранилища
   * @param key - Ключ для получения
   */
  public async getValue(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<string | null>> {
    return this.instanceGetValue(key);
  }

  /**
   * Удаление значения из защищенного хранилища
   * @param key - Ключ для удаления
   */
  public async removeValue(key: string | SecureStorageKeys): Promise<SecureStorageResult> {
    return this.instanceRemoveValue(key);
  }

  /**
   * Очистка всех значений из защищенного хранилища
   */
  public async clearAll(): Promise<SecureStorageResult> {
    return this.instanceClearAll();
  }

  /**
   * Проверка наличия значения в хранилище
   * @param key - Ключ для проверки
   */
  public async hasValue(key: string | SecureStorageKeys): Promise<SecureStorageResult<boolean>> {
    return this.instanceHasValue(key);
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ТОКЕНАМИ =====

  /**
   * Сохранение access токена
   * @param token - Access токен
   */
  public async saveAccessToken(token?: string | null): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.ACCESS_TOKEN, token);
  }

  /**
   * Получение access токена
   */
  public async loadAccessToken(): Promise<SecureStorageResult<string | null>> {
    return this.getValue(SecureStorageKeys.ACCESS_TOKEN);
  }

  /**
   * Сохранение refresh токена
   * @param token - Refresh токен
   */
  public async saveRefreshToken(token?: string | null): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.REFRESH_TOKEN, token);
  }

  /**
   * Получение refresh токена
   */
  public async loadRefreshToken(): Promise<SecureStorageResult<string | null>> {
    return this.getValue(SecureStorageKeys.REFRESH_TOKEN);
  }

  /**
   * Удаление access токена
   */
  public async removeAccessToken(): Promise<SecureStorageResult> {
    return this.removeValue(SecureStorageKeys.ACCESS_TOKEN);
  }

  /**
   * Удаление refresh токена
   */
  public async removeRefreshToken(): Promise<SecureStorageResult> {
    return this.removeValue(SecureStorageKeys.REFRESH_TOKEN);
  }

  /**
   * Сохранение обоих токенов
   * @param accessToken - Access токен
   * @param refreshToken - Refresh токен
   */
  public async saveTokens(
    accessToken?: string | null,
    refreshToken?: string | null,
  ): Promise<SecureStorageResult> {
    return this.instanceSaveTokens(accessToken, refreshToken);
  }

  /**
   * Загрузка обоих токенов
   */
  public async loadTokens(): Promise<SecureStorageResult<Tokens>> {
    return this.instanceLoadTokens();
  }

  /**
   * Удаление всех токенов
   */
  public async clearAllTokens(): Promise<SecureStorageResult> {
    return this.instanceClearAllTokens();
  }

  /**
   * Включение/выключение биометрии
   * @param enabled - Флаг включения
   */
  public async setBiometricEnabled(enabled: boolean): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.BIOMETRIC_ENABLED, enabled.toString());
  }

  /**
   * Проверка включена ли биометрия
   */
  public async isBiometricEnabled(): Promise<SecureStorageResult<boolean>> {
    const result = await this.getValue(SecureStorageKeys.BIOMETRIC_ENABLED);
    return {
      success: result.success,
      data: result.data === 'true',
      error: result.error,
    };
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЕМ =====

  /**
   * Сохранение идентификатора пользователя
   * @param userId - ID пользователя
   */
  public async saveUserUserId(userId: string): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.USER_ID, userId);
  }

  /**
   * Загрузка данных пользователя
   */
  public async loadUserData(): Promise<SecureStorageResult<{ userId: string | null }>> {
    const result = await this.getValue(SecureStorageKeys.USER_ID);
    return {
      success: result.success,
      data: {
        userId: result.data || null,
      },
      error: result.error,
    };
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ОБЪЕКТАМИ =====

  /**
   * Сохранение объекта в виде JSON
   * @param key - Ключ для сохранения
   * @param value - Объект для сохранения
   */
  public async saveObject<T>(
    key: string | SecureStorageKeys,
    value: T,
  ): Promise<SecureStorageResult> {
    return this.instanceSaveObject<T>(key, value);
  }

  /**
   * Получение объекта из JSON
   * @param key - Ключ для получения
   */
  public async getObject<T>(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<T | null>> {
    return this.instanceGetObject<T>(key);
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С PIN-КОДОМ =====

  /**
   * Сохранение PIN-кода
   * @param pin - PIN-код
   */
  public async savePin(pin: string): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.PIN_CODE, pin);
  }

  /**
   * Получение PIN-кода
   */
  public async loadPin(): Promise<SecureStorageResult<string | null>> {
    return this.getValue(SecureStorageKeys.PIN_CODE);
  }

  /**
   * Удаление PIN-кода
   */
  public async removePin(): Promise<SecureStorageResult> {
    return this.removeValue(SecureStorageKeys.PIN_CODE);
  }

  /**
   * Сохранение количества попыток ввода PIN-кода
   * @param attempts - Количество попыток
   */
  public async savePinAttempts(attempts: number): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.PIN_ATTEMPTS, attempts.toString());
  }

  /**
   * Получение количества попыток ввода PIN-кода
   */
  public async loadPinAttempts(): Promise<SecureStorageResult<number>> {
    const result = await this.getValue(SecureStorageKeys.PIN_ATTEMPTS);
    return {
      success: result.success,
      data: result.data ? parseInt(result.data, 10) : 0,
      error: result.error,
    };
  }

  /**
   * Сброс количества попыток ввода PIN-кода
   */
  public async resetPinAttempts(): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.PIN_ATTEMPTS, '0');
  }

  /**
   * Сохранение времени последней неудачной попытки ввода PIN-кода
   */
  public async savePinLastFailed(): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.PIN_LAST_FAILED, Date.now().toString());
  }

  /**
   * Получение времени последней неудачной попытки ввода PIN-кода
   */
  public async loadPinLastFailed(): Promise<SecureStorageResult<number>> {
    const result = await this.getValue(SecureStorageKeys.PIN_LAST_FAILED);
    return {
      success: result.success,
      data: result.data ? parseInt(result.data, 10) : 0,
      error: result.error,
    };
  }

  /**
   * Сохранение времени последней успешной аутентификации
   */
  public async savePinLastSuccess(): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.PIN_LAST_SUCCESS, Date.now().toString());
  }

  /**
   * Получение времени последней успешной аутентификации
   */
  public async loadPinLastSuccess(): Promise<SecureStorageResult<number>> {
    const result = await this.getValue(SecureStorageKeys.PIN_LAST_SUCCESS);
    return {
      success: result.success,
      data: result.data ? parseInt(result.data, 10) : 0,
      error: result.error,
    };
  }

  /**
   * Сохранение флага верификации пользователя
   * @param isVerified - Флаг верификации
   */
  public async saveIsVerified(isVerified: boolean): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.IS_VERIFIED, isVerified.toString());
  }

  /**
   * Получение флага верификации пользователя
   */
  public async loadIsVerified(): Promise<SecureStorageResult<boolean>> {
    const result = await this.getValue(SecureStorageKeys.IS_VERIFIED);
    return {
      success: result.success,
      data: result.data === 'true',
      error: result.error,
    };
  }

  /**
   * Проверка доступности Keychain
   */
  public async isKeychainAvailable(): Promise<boolean> {
    return this.instanceIsKeychainAvailable();
  }

  // ===== ПРИВАТНЫЕ МЕТОДЫ ЭКЗЕМПЛЯРА =====

  /**
   * Сохранение значения в защищенное хранилище (метод экземпляра)
   * @param key - Ключ для сохранения
   * @param value - Значение для сохранения
   */
  private async instanceSaveValue(
    key: string | SecureStorageKeys,
    value?: string | null | number | boolean,
  ): Promise<SecureStorageResult> {
    try {
      // Импортируем react-native-keychain только когда нужно
      const Keychain = await import('react-native-keychain');

      // Если значение undefined или null, удаляем ключ
      if (value === undefined || value === null) {
        return await this.instanceRemoveValue(key);
      }

      const stringValue = String(value);

      // Если строка пустая, удаляем ключ
      if (stringValue.trim() === '') {
        return await this.instanceRemoveValue(key);
      }

      // Используем уникальный username для каждого ключа
      const username = `token_${key.toString()}`;

      const result = await Keychain.setInternetCredentials(key.toString(), username, stringValue, {
        accessible: this.options.accessible,
        service: this.options.service,
      });

      return {
        success: result !== false,
        data: result !== false,
      };
    } catch (error) {
      console.error(`SecureStorage: Ошибка сохранения ключа "${key}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Получение значения из защищенного хранилища (метод экземпляра)
   * @param key - Ключ для получения
   */
  private async instanceGetValue(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<string | null>> {
    try {
      const Keychain = await import('react-native-keychain');

      const credentials = await Keychain.getInternetCredentials(key.toString());

      if (credentials && credentials.password) {
        return {
          success: true,
          data: credentials.password,
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error(`SecureStorage: Ошибка загрузки ключа "${key}":`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Удаление значения из защищенного хранилища (метод экземпляра)
   * @param key - Ключ для удаления
   */
  private async instanceRemoveValue(key: string | SecureStorageKeys): Promise<SecureStorageResult> {
    try {
      const Keychain = await import('react-native-keychain');

      // Удаляем через resetGenericPassword с сервисом
      await Keychain.resetGenericPassword({
        service: key.toString(),
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error(`SecureStorage: Ошибка удаления ключа "${key}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Очистка всех значений из защищенного хранилища (метод экземпляра)
   */
  private async instanceClearAll(): Promise<SecureStorageResult> {
    try {
      const Keychain = await import('react-native-keychain');

      // Получаем все ключи, которые мы могли сохранить
      const keys = Object.values(SecureStorageKeys);

      for (const key of keys) {
        await this.instanceRemoveValue(key);
      }

      // Также очищаем общее хранилище Keychain
      await Keychain.resetGenericPassword({
        service: this.options.service,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('SecureStorageService: Ошибка очистки всех значений:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Проверка наличия значения в хранилище (метод экземпляра)
   * @param key - Ключ для проверки
   */
  private async instanceHasValue(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<boolean>> {
    try {
      const result = await this.instanceGetValue(key);

      return {
        success: result.success,
        data: result.success && result.data !== null && result.data !== '',
        error: result.error,
      };
    } catch (error) {
      console.error(`SecureStorage: Ошибка проверки ключа "${key}":`, error);
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  // ===== ПРИВАТНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ТОКЕНАМИ =====

  /**
   * Сохранение обоих токенов (метод экземпляра)
   * @param accessToken - Access токен
   * @param refreshToken - Refresh токен
   */
  private async instanceSaveTokens(
    accessToken?: string | null,
    refreshToken?: string | null,
  ): Promise<SecureStorageResult> {
    try {
      const [accessResult, refreshResult] = await Promise.all([
        this.saveAccessToken(accessToken),
        this.saveRefreshToken(refreshToken),
      ]);

      return {
        success: accessResult.success && refreshResult.success,
        error: accessResult.error || refreshResult.error,
      };
    } catch (error) {
      console.error('SecureStorageService: Ошибка сохранения токенов:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Загрузка обоих токенов (метод экземпляра)
   */
  private async instanceLoadTokens(): Promise<SecureStorageResult<Tokens>> {
    try {
      const [accessResult, refreshResult] = await Promise.all([
        this.loadAccessToken(),
        this.loadRefreshToken(),
      ]);

      return {
        success: accessResult.success && refreshResult.success,
        data: {
          accessToken: accessResult.data || null,
          refreshToken: refreshResult.data || null,
        },
        error: accessResult.error || refreshResult.error,
      };
    } catch (error) {
      console.error('SecureStorageService: Ошибка загрузки токенов:', error);
      return {
        success: false,
        data: {
          accessToken: null,
          refreshToken: null,
        },
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Удаление всех токенов (метод экземпляра)
   */
  private async instanceClearAllTokens(): Promise<SecureStorageResult> {
    try {
      await Promise.all([
        this.removeAccessToken(),
        this.removeRefreshToken(),
        this.instanceRemoveValue(SecureStorageKeys.FCM_TOKEN_KEY),
      ]);

      return {
        success: true,
      };
    } catch (error) {
      console.error('SecureStorageService: Ошибка очистки токенов:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  // ===== ПРИВАТНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ОБЪЕКТАМИ =====

  /**
   * Сохранение объекта в виде JSON (метод экземпляра)
   * @param key - Ключ для сохранения
   * @param value - Объект для сохранения
   */
  private async instanceSaveObject<T>(
    key: string | SecureStorageKeys,
    value: T,
  ): Promise<SecureStorageResult> {
    try {
      const stringValue = JSON.stringify(value);
      return await this.instanceSaveValue(key, stringValue);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Получение объекта из JSON (метод экземпляра)
   * @param key - Ключ для получения
   */
  private async instanceGetObject<T>(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<T | null>> {
    try {
      const result = await this.instanceGetValue(key);

      if (!result.success || !result.data) {
        return {
          success: result.success,
          data: null,
          error: result.error,
        };
      }

      const parsedData = JSON.parse(result.data) as T;
      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Проверка доступности Keychain (метод экземпляра)
   */
  private async instanceIsKeychainAvailable(): Promise<boolean> {
    try {
      // Простая проверка записи/чтения тестового значения
      const testKey = '__test_keychain_availability__';
      const testValue = 'test';

      await this.instanceSaveValue(testKey, testValue);
      const result = await this.instanceGetValue(testKey);
      await this.instanceRemoveValue(testKey);

      return result.success && result.data === testValue;
    } catch {
      return false;
    }
  }
}

// Экспортируем класс для особых случаев (например, если нужно создать новый экземпляр)
export { SecureStorageService };

// Экспортируем готовый экземпляр по умолчанию (самый удобный способ)
const secureStorage = SecureStorageService.getInstance();
export default secureStorage;

// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
//
// Импорт дефолтного экземпляра:
// import SecureStorageService from './SecureStorageService';
//
// Примеры использования:
// await SecureStorageService.savePin('1234');
// await SecureStorageService.resetPinAttempts();
// await SecureStorageService.saveTokens('access_token', 'refresh_token');
//
// Если нужен доступ к классу для создания нового экземпляра:
// import { SecureStorageService as SecureStorageClass } from './SecureStorageService';
// const customStorage = SecureStorageClass.getInstance({ service: 'custom' });
