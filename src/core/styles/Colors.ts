/**
 * Цветовая палитра приложения
 * Используется во всех UI-компонентах
 */
export const Colors = {
  // ===== Базовые цвета =====
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // ===== Системные цвета =====
  systemDark: '#000000',
  ripple: '#C0C1C6',

  // ===== Основные цвета =====
  primary: '#312187FF',
  primaryLight: '#5A4BA8',
  primaryDark: '#1E1466',

  // ===== Акцентные цвета =====
  blue: '#007AFF',
  blueLight: '#4DA3FF',
  blueDark: '#0055CC',

  // ===== Статусные цвета =====
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#5856D6',

  // ===== Текст =====
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // ===== Фоны =====
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#E8E8E8',

  // ===== Границы =====
  borderPrimary: '#D1D1D6',
  borderSecondary: '#E5E5EA',

  // ===== Алиасы (для обратной совместимости) =====
  gray: '#666666',
  red: '#FF0000',
} as const;

export type ColorKey = keyof typeof Colors;
export type ColorValue = typeof Colors[ColorKey];
