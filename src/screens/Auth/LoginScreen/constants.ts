export const CONSTANTS = {
  // Время отображения ошибки (5 секунд)
  ERROR_DISPLAY_DURATION: 5000,
  // Минимальная длина номера телефона для активации кнопки
  MIN_PHONE_LENGTH: 10,
} as const;

export const ERROR_MESSAGES = {
  FCM_TOKEN_NOT_RECEIVED: 'FCM токен не получен. Попробуйте позже.',
  NETWORK_ERROR: 'Ошибка сети',
  UNKNOWN_ERROR: 'Неизвестная ошибка',
} as const;
