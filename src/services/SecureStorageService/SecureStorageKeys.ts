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
  PHONE_NUMBER = 'refresh_token',

  // ===== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ =====
  /** Идентификатор пользователя */
  USER_ID = 'user_id',
  /** Флаг верификации пользователя */
  IS_VERIFIED = 'isVerified',

  // ===== БИОМЕТРИЧЕСКАЯ АУТЕНТИФИКАЦИЯ =====
  /** Флаг включения/отключения биометрической аутентификации */
  BIOMETRIC_ENABLED = 'biometric_enabled',

  // ===== PUSH-УВЕДОМЛЕНИЯ =====
  /** FCM токен для push-уведомлений */
  FCM_TOKEN_KEY = 'fcm_token',
  /** Разрешение на получение уведомлений */
  NOTIFICATION_PERMISSION_KEY = 'notification_permission',

  // ===== PIN-КОД ДЛЯ ПРИЛОЖЕНИЯ =====
  /** PIN-код для входа в приложение */
  PIN_CODE = 'pin_code',
  /** Количество неудачных попыток ввода PIN-кода */
  PIN_ATTEMPTS = 'pin_attempts',
  /** Время последней неудачной попытки ввода PIN-кода */
  PIN_LAST_FAILED = 'pin_last_failed',
  /** Время последней успешной аутентификации */
  PIN_LAST_SUCCESS = 'pin_last_success',

  // ===== НАСТРОЙКИ ПРИЛОЖЕНИЯ =====
  /** Язык приложения */
  APP_LANGUAGE = 'app_language',
  /** Тема приложения (светлая/темная) */
  APP_THEME = 'app_theme',
  /** Флаг первого запуска приложения */
  FIRST_LAUNCH = 'first_launch',

  // ===== НАСТРОЙКИ ПОВЕДЕНИЯ ПРИЛОЖЕНИЯ =====
  /** Флаг включения/отключения уведомлений */
  NOTIFICATIONS_ENABLED = 'notifications_enabled',
  /** Флаг включения/отключения звука */
  SOUND_ENABLED = 'sound_enabled',
  /** Флаг включения/отключения вибрации */
  VIBRATION_ENABLED = 'vibration_enabled',

  // ===== НАСТРОЙКИ API =====
  /** Базовый URL API */
  API_BASE_URL = 'api_base_url',
  /** Таймаут запросов к API */
  API_TIMEOUT = 'api_timeout',

  // ===== ДАННЫЕ СЕССИИ =====
  /** Идентификатор сессии */
  SESSION_ID = 'session_id',
  /** Время истечения сессии */
  SESSION_EXPIRY = 'session_expiry',

  // ===== КЭШИРОВАНИЕ ДАННЫХ =====
  /** Версия кэша */
  CACHE_VERSION = 'cache_version',
  /** Дата последней синхронизации */
  LAST_SYNC_DATE = 'last_sync_date',

  // ===== АНАЛИТИКА =====
  /** Идентификатор аналитики */
  ANALYTICS_ID = 'analytics_id',
  /** Флаг включения/отключения аналитики */
  ANALYTICS_ENABLED = 'analytics_enabled',

  // ===== КОНФИГУРАЦИЯ PIN =====
  MAX_ATTEMPTS = 3,
  LOCK_DURATION = 30000,
  PIN_LENGTH = '4',
  RETRY_DELAY = 1000,
  BIOMETRIC_KEY = 'biometric_auth_key',
}
