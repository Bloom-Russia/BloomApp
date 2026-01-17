import { Text } from 'react-native';
import styled from 'styled-components';

import { spacings, SpacingsProps } from '../helpers';
import { Colors } from './Colors';

// ===== Базовые интерфейсы =====
export interface ColoredTextProps {
  color?: string;
  textAlign?: string;
  flexShrink?: number;
}

// ===== Базовый стилизованный компонент =====
/**
 * Базовый текстовый компонент с поддержкой цвета, выравнивания и сжатия
 * Расширяет SpacingsProps для использования отступов из helpers
 */
const coloredText = styled(Text)<ColoredTextProps & SpacingsProps>`
  color: ${({ color }) => color || Colors.black};
  text-align: ${({ textAlign }) => textAlign || 'left'};
  ${({ flexShrink }) => (typeof flexShrink === 'number' ? `flex-shrink: ${flexShrink}` : '')}
  ${(props) => spacings(props)}
`;

// ===== Компоненты по начертанию шрифта =====
/**
 * Regular (обычное) начертание
 */
const regular = styled(coloredText)`
  font-family: 'Inter-Regular';
`;

/**
 * SemiBold (полужирное) начертание
 */
const semiBold = styled(coloredText)`
  font-family: 'Inter-SemiBold';
`;

/**
 * Medium (среднее) начертание
 */
const medium = styled(coloredText)`
  font-family: 'Inter-Medium';
`;

/**
 * Bold (жирное) начертание
 */
const bold = styled(coloredText)`
  font-family: 'Inter-Bold';
`;

// ===== Типографические компоненты =====
/**
 * Bold 14px - жирный текст, размер 14px, высота строки 18px
 */
const B14 = styled(bold)`
  font-size: 14px;
  line-height: 18px;
`;

/**
 * Bold 16px - жирный текст, размер 16px, высота строки 20px
 */
const B16 = styled(bold)`
  font-size: 16px;
  line-height: 20px;
`;

/**
 * Bold 20px - жирный текст, размер 20px, высота строки 25px
 */
const B20 = styled(bold)`
  font-size: 20px;
  line-height: 25px;
`;

/**
 * Regular 14px - обычный текст, размер 14px, высота строки 18px
 */
const R14 = styled(regular)`
  font-size: 14px;
  line-height: 18px;
`;

/**
 * Regular 16px - обычный текст, размер 16px, высота строки 22px
 */
const R16 = styled(regular)`
  font-size: 16px;
  line-height: 22px;
`;

/**
 * Regular 24px - обычный текст, размер 24px, высота строки 30px
 */
const R24 = styled(regular)`
  font-size: 24px;
  line-height: 30px;
`;

/**
 * SemiBold 14px - полужирный текст, размер 14px, высота строки 18px
 */
const S14 = styled(semiBold)`
  font-size: 14px;
  line-height: 18px;
`;

/**
 * Medium 14px - средний текст, размер 14px, высота строки 18px
 */
const M14 = styled(medium)`
  font-size: 14px;
  line-height: 18px;
`;

/**
 * Medium 16px - средний текст, размер 16px, высота строки 22px
 */
const M16 = styled(medium)`
  font-size: 16px;
  line-height: 22px;
`;

// ===== Экспорт всех компонентов =====
/**
 * Коллекция типографических компонентов для использования в приложении
 * Используйте соответствующий компонент в зависимости от нужного начертания и размера
 */
export const Typography = {
  B14,
  B16,
  B20,
  R14,
  R16,
  R24,
  S14,
  M14,
  M16,
};
