/**
 * Интерфейс репозитория для безопасного хранения данных
 * Использует react-native-keychain для шифрованного хранения
 */
export interface ISecureStorageRepository {
  /**
   * Сохранение значения по ключу
   * @param key - ключ для сохранения
   * @param value - значение (строка, число, boolean)
   * @returns true если успешно, false если ошибка
   */
  saveValue(key: string, value: string | null | number | boolean): Promise<boolean>;

  /**
   * Получение значения по ключу
   * @param key - ключ для получения
   * @returns значение или null
   */
  getValue<T = string>(key: string): Promise<T | null>;

  /**
   * Удаление значения по ключу
   * @param key - ключ для удаления
   * @returns true если успешно, false если ошибка
   */
  removeValue(key: string): Promise<boolean>;

  /**
   * Очистка всех данных в хранилище
   * @returns true если успешно, false если ошибка
   */
  clearAll(): Promise<boolean>;

  /**
   * Сохранение Access Token
   */
  saveAccessToken(token: string): Promise<boolean>;

  /**
   * Получение Access Token
   */
  loadAccessToken(): Promise<string | null>;

  /**
   * Сохранение Refresh Token
   */
  saveRefreshToken(token: string): Promise<boolean>;

  /**
   * Получение Refresh Token
   */
  loadRefreshToken(): Promise<string | null>;

  /**
   * Сохранение обоих токенов одновременно
   */
  saveTokens(accessToken: string, refreshToken: string): Promise<boolean>;

  /**
   * Сохранение статуса верификации
   */
  saveIsVerified(value: boolean): Promise<boolean>;

  /**
   * Получение статуса верификации
   */
  loadIsVerified(): Promise<boolean>;

  /**
   * Сохранение номера телефона
   */
  savePhoneNumber(phone: string): Promise<boolean>;

  /**
   * Получение номера телефона
   */
  loadPhoneNumber(): Promise<string | null>;

  /**
   * Сохранение статуса установки PIN-кода
   */
  savePinCodeStatus(isSet: boolean): Promise<boolean>;

  /**
   * Получение статуса установки PIN-кода
   */
  loadPinCodeStatus(): Promise<boolean>;

  /**
   * Сохранение статуса завершения онбординга
   */
  saveOnboardingCompleted(completed: boolean): Promise<boolean>;

  /**
   * Получение статуса завершения онбординга
   */
  loadOnboardingCompleted(): Promise<boolean>;

  /**
   * Сохранение статуса включения биометрии
   */
  saveBiometricEnabled(enabled: boolean): Promise<boolean>;

  /**
   * Получение статуса включения биометрии
   */
  loadBiometricEnabled(): Promise<boolean>;

  /**
   * Сохранение статуса настройки биометрии
   */
  saveBiometricSetupCompleted(completed: boolean): Promise<boolean>;

  /**
   * Получение статуса настройки биометрии
   */
  loadBiometricSetupCompleted(): Promise<boolean>;

  /**
   * Сохранение всех данных аутентификации одним вызовом
   */
  saveAllAuthData(params: {
    accessToken: string;
    refreshToken: string;
    phoneNumber?: string;
    isVerified?: boolean;
  }): Promise<boolean>;

  /**
   * Загрузка всех данных аутентификации одним вызовом
   */
  loadAllAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    phoneNumber: string | null;
    isVerified: boolean;
  }>;

  /**
   * Очистка всех данных аутентификации
   */
  clearAllAuthData(): Promise<boolean>;
}
