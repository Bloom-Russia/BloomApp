import { TextStyle } from 'react-native';
import { Colors } from './Colors';

// ============================================
// 1. КОНФИГУРАЦИЯ ШРИФТОВ
// ============================================

/**
 * Семейства шрифтов, используемые в приложении
 * Реальные названия шрифтов из файлов .ttf
 */
export const FontFamily = {
  /** Обычный шрифт */
  Regular: 'Inter-Regular',
  /** Средний шрифт (Medium) */
  Medium: 'Inter-Medium',
  /** Полужирный шрифт (SemiBold) */
  SemiBold: 'Inter-SemiBold',
  /** Жирный шрифт (Bold) */
  Bold: 'Inter-Bold',
  /** Легкий шрифт (Light) */
  Light: 'Inter-Light',
  /** Тонкий шрифт (Thin) */
  Thin: 'Inter-Thin',
} as const;

/**
 * Тип для семейства шрифтов
 */
export type FontFamilyType = typeof FontFamily[keyof typeof FontFamily];

// ============================================
// 2. РАЗМЕРЫ ШРИФТОВ
// ============================================

/**
 * Стандартные размеры шрифтов
 * Используются для создания единообразной типографики
 */
export const FontSize = {
  /** Микро-текст (подписи, метки) */
  xs: 10,
  /** Очень маленький текст */
  sm: 12,
  /** Маленький текст */
  md: 14,
  /** Средний текст (основной) */
  base: 16,
  /** Большой текст */
  lg: 18,
  /** Очень большой текст */
  xl: 20,
  /** Заголовок */
  '2xl': 24,
  /** Большой заголовок */
  '3xl': 28,
  /** Очень большой заголовок */
  '4xl': 32,
  /** Гигантский заголовок */
  '5xl': 40,
} as const;

/**
 * Тип для размера шрифта
 */
export type FontSizeType = typeof FontSize[keyof typeof FontSize];

// ============================================
// 3. ВЫСОТА СТРОКИ
// ============================================

/**
 * Стандартные значения line-height
 * Обычно рассчитываются как размер шрифта * 1.2-1.5
 */
export const LineHeight = {
  xs: 14,
  sm: 16,
  md: 18,
  base: 22,
  lg: 24,
  xl: 28,
  '2xl': 30,
  '3xl': 34,
  '4xl': 40,
  '5xl': 48,
} as const;

// ============================================
// 4. БАЗОВЫЕ СТИЛИ ТЕКСТА
// ============================================

/**
 * Базовые текстовые стили без привязки к размеру
 * Используются как строительные блоки для конкретных компонентов
 */
export const TextStyles = {
  // ===== По начертанию =====
  /** Обычный текст */
  regular: {
    fontFamily: FontFamily.Regular,
  } as TextStyle,

  /** Средний текст (Medium) */
  medium: {
    fontFamily: FontFamily.Medium,
  } as TextStyle,

  /** Полужирный текст (SemiBold) */
  semibold: {
    fontFamily: FontFamily.SemiBold,
  } as TextStyle,

  /** Жирный текст (Bold) */
  bold: {
    fontFamily: FontFamily.Bold,
  } as TextStyle,

  /** Легкий текст (Light) */
  light: {
    fontFamily: FontFamily.Light,
  } as TextStyle,

  // ===== По цвету =====
  /** Основной цвет текста */
  primary: {
    color: Colors.textPrimary,
  } as TextStyle,

  /** Вторичный цвет текста */
  secondary: {
    color: Colors.textSecondary,
  } as TextStyle,

  /** Третичный цвет текста */
  tertiary: {
    color: Colors.textTertiary,
  } as TextStyle,

  /** Инвертированный цвет (на темном фоне) */
  inverse: {
    color: Colors.textInverse,
  } as TextStyle,

  /** Цвет ошибки */
  error: {
    color: Colors.error,
  } as TextStyle,

  /** Цвет успеха */
  success: {
    color: Colors.success,
  } as TextStyle,

  // ===== По выравниванию =====
  /** Выравнивание по центру */
  center: {
    textAlign: 'center',
  } as TextStyle,

  /** Выравнивание влево */
  left: {
    textAlign: 'left',
  } as TextStyle,

  /** Выравнивание вправо */
  right: {
    textAlign: 'right',
  } as TextStyle,

  /** Выравнивание по ширине */
  justify: {
    textAlign: 'justify',
  } as TextStyle,

  // ===== Дополнительные стили =====
  /** Зачеркнутый текст */
  strikethrough: {
    textDecorationLine: 'line-through',
  } as TextStyle,

  /** Подчеркнутый текст */
  underline: {
    textDecorationLine: 'underline',
  } as TextStyle,
};

// ============================================
// 5. ПРЕДУСТАНОВЛЕННЫЕ ТИПОГРАФИЧЕСКИЕ СТИЛИ
// ============================================

/**
 * Готовая типографическая система
 * Используйте эти стили для единообразия во всем приложении
 */
export const TypographyStyles = {
  // ===== Заголовки =====
  /** H1 - Самый большой заголовок */
  h1: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize['5xl'],
    lineHeight: LineHeight['5xl'],
    color: Colors.textPrimary,
  } as TextStyle,

  /** H2 - Большой заголовок */
  h2: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize['4xl'],
    lineHeight: LineHeight['4xl'],
    color: Colors.textPrimary,
  } as TextStyle,

  /** H3 - Средний заголовок */
  h3: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    color: Colors.textPrimary,
  } as TextStyle,

  /** H4 - Маленький заголовок */
  h4: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    color: Colors.textPrimary,
  } as TextStyle,

  // ===== Текст =====
  /** Основной текст (Body) */
  body: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    color: Colors.textPrimary,
  } as TextStyle,

  /** Основной текст с жирным начертанием (Body Bold) */
  bodyBold: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    color: Colors.textPrimary,
  } as TextStyle,

  /** Вторичный текст (Secondary) */
  secondary: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    color: Colors.textSecondary,
  } as TextStyle,

  /** Третичный текст (Tertiary) */
  tertiary: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    color: Colors.textTertiary,
  } as TextStyle,

  // ===== Мелкий текст =====
  /** Маленький текст */
  small: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    color: Colors.textSecondary,
  } as TextStyle,

  /** Очень маленький текст */
  xsmall: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    color: Colors.textTertiary,
  } as TextStyle,

  // ===== Кнопки =====
  /** Текст на кнопке */
  button: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    color: Colors.white,
  } as TextStyle,

  /** Текст на маленькой кнопке */
  buttonSmall: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    color: Colors.white,
  } as TextStyle,

  // ===== Специальные =====
  /** Подпись к изображению/карточке */
  caption: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    color: Colors.textSecondary,
  } as TextStyle,

  /** Текст ошибки */
  error: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    color: Colors.error,
  } as TextStyle,

  /** Текст успеха */
  success: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    color: Colors.success,
  } as TextStyle,
};

// ============================================
// 6. ТИПЫ ДЛЯ ИСПОЛЬЗОВАНИЯ
// ============================================

/**
 * Тип для всех стилей из TypographyStyles
 */
export type TypographyStyleKey = keyof typeof TypographyStyles;

/**
 * Тип для готового стиля
 */
export type TypographyStyle = TextStyle;

// ============================================
// 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить стиль по ключу
 */
export const getTypographyStyle = (key: TypographyStyleKey): TypographyStyle => {
  return TypographyStyles[key];
};

/**
 * Объединить несколько стилей
 */
export const combineTypographyStyles = (
  ...keys: TypographyStyleKey[]
): TypographyStyle => {
  return keys.reduce((acc, key) => ({
    ...acc,
    ...TypographyStyles[key],
  }), {});
};

// ============================================
// 8. ЭКСПОРТ
// ============================================

export default {
  FontFamily,
  FontSize,
  LineHeight,
  TextStyles,
  TypographyStyles,
  getTypographyStyle,
  combineTypographyStyles,
};
