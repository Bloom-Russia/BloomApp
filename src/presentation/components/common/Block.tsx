import { spacings, SpacingsProps } from '@core/styles';
import React from 'react';
import { ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';

export interface BlockStyleProps {
  /** Выравнивание по основной оси */
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  /** Выравнивание по поперечной оси */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  /** Выравнивание самого элемента */
  alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto';
  /** Flex-фактор */
  flex?: number;
  /** Flex-shrink */
  flexShrink?: number;
  /** Тень (Android) */
  elevation?: number;
  /** Скругление */
  borderRadius?: number;
  /** Цвет фона */
  backgroundColor?: string;
  /** Обрезать содержимое */
  overflow?: boolean;
  /** Отступ между элементами */
  gap?: number;
  /** Flex-direction */
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Flex-wrap */
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export type BlockProps = BlockStyleProps &
  ViewProps &
  SpacingsProps & {
    children?: React.ReactNode;
  };

/**
 * Базовый контейнерный компонент
 * Используется для создания блоков с отступами и выравниванием
 */
export const Block = styled.View<BlockProps>`
  ${({ overflow }) => overflow && 'overflow: hidden;'}
  align-items: ${({ alignItems }) => alignItems ?? 'stretch'};
  align-self: ${({ alignSelf }) => alignSelf ?? 'auto'};
  background-color: ${({ backgroundColor }) => backgroundColor ?? 'transparent'};
  justify-content: ${({ justifyContent }) => justifyContent ?? 'flex-start'};
  elevation: ${({ elevation }) => elevation ?? 0};
  border-radius: ${({ borderRadius }) => borderRadius ?? 0}px;
  flex-direction: ${({ flexDirection }) => flexDirection ?? 'column'};
  flex-wrap: ${({ flexWrap }) => flexWrap ?? 'nowrap'};

  ${({ flex }) =>
    flex &&
    css`
      flex: ${flex};
    `}
  ${({ flexShrink }) =>
    flexShrink !== undefined &&
    css`
      flex-shrink: ${flexShrink};
    `}
  ${({ gap }) =>
    gap !== undefined &&
    css`
      gap: ${gap}px;
    `}
  ${(props) => spacings(props)}
`;

/**
 * Строка (горизонтальный контейнер)
 */
export const Row = styled(Block)`
  flex-direction: row;
` as React.ComponentType<BlockProps>;

/**
 * Колонка (вертикальный контейнер)
 */
export const Column = styled(Block)`
  flex-direction: column;
` as React.ComponentType<BlockProps>;
