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
  BIOMETRIC_SETUP_COMPLETED = 'biometric_setup_completed',

  // ===== PUSH-УВЕДОМЛЕНИЯ =====
  /** FCM токен для push-уведомлений */
  FCM_TOKEN_KEY = 'fcm_token',

  // ===== PIN-КОД ДЛЯ ПРИЛОЖЕНИЯ =====
  /** PIN-код для входа в приложение */
  PIN_CODE_IS_SET = 'pin_code_is_set',
  /** onboarding показан */
  ONBOARDING_COMPLETED = 'onboarding_completed',
}
