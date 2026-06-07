// SecureStorageKeys.ts

/**
 * Ключи для безопасного хранилища.
 * Используются для сохранения и получения данных из защищенного хранилища.
 */
export enum SecureStorageKeys {
  // ===== ТОКЕНЫ АУТЕНТИФИКАЦИИ =====
  /** Access токен для авторизации API запросов */
  ACCESS_TOKEN = 'access_token',
  /** Refresh токен для обновления access токена */
  REFRESH_TOKEN = 'refresh_token',
  //Номер телефона пользователя
  PHONE_NUMBER = 'phone_number',

  // ===== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ =====
  /** Флаг верификации пользователя */
  IS_VERIFIED = 'isVerified',

  // ===== БИОМЕТРИЧЕСКАЯ АУТЕНТИФИКАЦИЯ =====
  /** Флаг включения/отключения биометрической аутентификации */
  BIOMETRIC_ENABLED = 'biometric_enabled',

  // ===== PUSH-УВЕДОМЛЕНИЯ =====
  /** FCM токен для push-уведомлений */
  FCM_TOKEN_KEY = 'fcm_token',

  // ===== PIN-КОД ДЛЯ ПРИЛОЖЕНИЯ =====
  /** PIN-код для входа в приложение */
  PIN_CODE_IS_SET = 'pin_code_is_set',
  /** Количество неудачных попыток ввода PIN-кода */
  PIN_ATTEMPTS = 'pin_attempts',
  /** Время последней неудачной попытки ввода PIN-кода */
  PIN_LAST_FAILED = 'pin_last_failed',
  /** Время последней успешной аутентификации */
  PIN_LAST_SUCCESS = 'pin_last_success',
}
