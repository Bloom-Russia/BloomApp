import { Colors } from '@core/styles/Colors';
import { spacings, SpacingsProps } from '@core/styles/Spacings';
import { FontFamily, TypographyStyles } from '@core/styles/Typography';
import React from 'react';
import { TextProps } from 'react-native';
import styled from 'styled-components/native';

// ============================================
// 1. БАЗОВЫЙ КОМПОНЕНТ
// ============================================

export interface TypographyProps extends TextProps, SpacingsProps {
  /** Цвет текста */
  color?: string;
  /** Выравнивание текста */
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /** Flex-shrink */
  flexShrink?: number;
  /** Количество строк */
  numberOfLines?: number;
  /** Размер шрифта (можно переопределить) */
  fontSize?: number;
  /** Вариант стиля из TypographyStyles */
  variant?: keyof typeof TypographyStyles;
}

// ============================================
// 2. БАЗОВЫЙ СТИЛИЗОВАННЫЙ ТЕКСТ
// ============================================

/**
 * Базовый текстовый компонент
 * Используется как основа для всех типографических компонентов
 */
const BaseText = styled.Text<TypographyProps>`
  color: ${({ color }) => color || Colors.textPrimary};
  text-align: ${({ textAlign }) => textAlign || 'left'};
  ${({ flexShrink }) => (typeof flexShrink === 'number' ? `flex-shrink: ${flexShrink}` : '')}
  ${({ fontSize }) => (fontSize ? `font-size: ${fontSize}px` : '')}
  ${(props) => spacings(props)}
`;

// ============================================
// 3. ШРИФТЫ ПО НАЧЕРТАНИЮ
// ============================================

/**
 * Компоненты с предустановленным начертанием
 * Используйте их, когда нужно только начертание, а размер задается отдельно
 */
const Regular = styled(BaseText)`
  font-family: '${FontFamily.Regular}';
`;

const Medium = styled(BaseText)`
  font-family: '${FontFamily.Medium}';
`;

const SemiBold = styled(BaseText)`
  font-family: '${FontFamily.SemiBold}';
`;

const Bold = styled(BaseText)`
  font-family: '${FontFamily.Bold}';
`;

const Light = styled(BaseText)`
  font-family: '${FontFamily.Light}';
`;

// ============================================
// 4. ГОТОВЫЕ КОМПОНЕНТЫ С РАЗМЕРОМ
// ============================================

/**
 * Компоненты с предустановленным начертанием и размером
 * Используйте их для единообразия типографики во всем приложении
 */

// ===== Bold =====
/** Жирный текст 14px */
const B14 = styled(Bold)`
  font-size: 14px;
  line-height: 18px;
`;

/** Жирный текст 16px */
const B16 = styled(Bold)`
  font-size: 16px;
  line-height: 20px;
`;

/** Жирный текст 20px */
const B20 = styled(Bold)`
  font-size: 20px;
  line-height: 25px;
`;

/** Жирный текст 24px */
const B24 = styled(Bold)`
  font-size: 24px;
  line-height: 30px;
`;

/** Жирный текст 28px */
const B28 = styled(Bold)`
  font-size: 28px;
  line-height: 32px;
`;

// ===== Regular =====
/** Обычный текст 14px */
const R14 = styled(Regular)`
  font-size: 14px;
  line-height: 18px;
`;

/** Обычный текст 16px */
const R16 = styled(Regular)`
  font-size: 16px;
  line-height: 22px;
`;

/** Обычный текст 24px */
const R24 = styled(Regular)`
  font-size: 24px;
  line-height: 30px;
`;

// ===== SemiBold =====
/** Полужирный текст 14px */
const S14 = styled(SemiBold)`
  font-size: 14px;
  line-height: 18px;
`;

/** Полужирный текст 16px */
const S16 = styled(SemiBold)`
  font-size: 16px;
  line-height: 22px;
`;

// ===== Medium =====
/** Средний текст 14px */
const M14 = styled(Medium)`
  font-size: 14px;
  line-height: 18px;
`;

/** Средний текст 16px */
const M16 = styled(Medium)`
  font-size: 16px;
  line-height: 22px;
`;

// ============================================
// 5. УНИВЕРСАЛЬНЫЙ КОМПОНЕНТ (с variant)
// ============================================

/**
 * Универсальный типографический компонент
 * Используйте его, когда нужно быстро применить стиль из TypographyStyles
 *
 * @example
 * <Typography variant="h3">Заголовок</Typography>
 * <Typography variant="body" color="error">Текст ошибки</Typography>
 */
const TypographyComponent: React.FC<TypographyProps> = ({ variant, children, style, ...props }) => {
  // ✅ Применяем variant стили через style проп
  const variantStyle = variant ? TypographyStyles[variant] : undefined;

  return (
    <BaseText style={[variantStyle, style]} {...props}>
      {children}
    </BaseText>
  );
};

// ============================================
// 6. ЭКСПОРТЫ
// ============================================

/**
 * 📚 Типографическая система
 *
 * @example
 * // Использование готовых компонентов
 * <Typography.B16 color="primary">Жирный заголовок</Typography.B16>
 * <Typography.R14 color="secondary">Обычный текст</Typography.R14>
 *
 * @example
 * // Использование универсального компонента
 * <Typography.Typography variant="h3">Заголовок</Typography.Typography>
 */
export const Typography = {
  /** Универсальный компонент с variant */
  Typography: TypographyComponent,

  /** Жирный текст 14px */
  B14,
  /** Жирный текст 16px */
  B16,
  /** Жирный текст 20px */
  B20,
  /** Жирный текст 24px */
  B24,
  /** Жирный текст 28px */
  B28,

  /** Обычный текст 14px */
  R14,
  /** Обычный текст 16px */
  R16,
  /** Обычный текст 24px */
  R24,

  /** Полужирный текст 14px */
  S14,
  /** Полужирный текст 16px */
  S16,

  /** Средний текст 14px */
  M14,
  /** Средний текст 16px */
  M16,

  /** Базовые начертания */
  Regular,
  Medium,
  SemiBold,
  Bold,
  Light,
} as const;

// ============================================
// 7. ТИПЫ
// ============================================

/**
 * Тип для всех предустановленных компонентов
 */
export type TypographyComponent =
  | typeof B14
  | typeof B16
  | typeof B20
  | typeof B24
  | typeof B28
  | typeof R14
  | typeof R16
  | typeof R24
  | typeof S14
  | typeof S16
  | typeof M14
  | typeof M16
  | typeof Regular
  | typeof Medium
  | typeof SemiBold
  | typeof Bold
  | typeof Light;

/**
 * Тип для всех вариантов из TypographyStyles
 */
export type TypographyVariant = keyof typeof TypographyStyles;

/**
 * Тип для объекта Typography (все компоненты)
 */
export type TypographyObject = typeof Typography;

// ============================================
// 8. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================

/**
 * Экспорт по умолчанию - вся типографическая система
 */
export default Typography;
