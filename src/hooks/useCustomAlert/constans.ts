// ==================== КОНСТАНТЫ ====================
/**
 * Цветовые константы для избежания "магических чисел" и соответствия правилу ESLint
 */
export const COLORS = {
  WHITE: '#ffffff',
  GRAY_LIGHT: '#f5f5f5',
  GRAY_MEDIUM: '#e0e0e0',
  GRAY_DARK: '#333333',
  GRAY_DISABLED: '#cccccc',
  GRAY_DISABLED_TEXT: '#666666',
  GRAY_CANCEL: '#6a6a6a', // Более темный серый для кнопки отмены (на 25% темнее)
  SEMI_TRANSPARENT_WHITE: 'rgba(255, 255, 255, 0.1)',
  RED_DESTRUCTIVE: '#ff4757',
  BLACK: '#000000',
  SHADOW_RED_LIGHT: '#FF0000', // Ярко-красный для светлой темы (значение по умолчанию)
  SHADOW_RED_DARK: '#FF0000', // Яркий красный для темной темы (значение по умолчанию)
} as const;

/**
 * Константы отступов для единообразия и легкой настройки
 */
export const SPACING = {
  XS: 8, // Маленький отступ
  SM: 16, // Средний отступ
  MD: 24, // Большой отступ
} as const;
