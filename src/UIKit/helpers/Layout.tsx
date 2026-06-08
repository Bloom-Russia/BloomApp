import React from 'react';
import { ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';

import { spacings, SpacingsProps } from './spacings';

interface BlockStyleProps {
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' | 'auto';
  flex?: number;
  flexShrink?: number;
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  overflow?: boolean;
  gap?: number;
}

export type BlockProps = BlockStyleProps &
  ViewProps &
  SpacingsProps & {
    children?: React.ReactNode;
  };

// Вспомогательная функция для обработки числовых значений gap
const getGapStyle = (gap?: number) => {
  if (gap === undefined) {
    return '';
  }
  return css`
    gap: ${gap}px;
  `;
};

export const Block = styled.View<BlockProps>`
  ${({ overflow }) => overflow && 'overflow: hidden;'}
  align-items: ${({ alignItems }) => alignItems ?? 'stretch'};
  align-self: ${({ alignSelf }) => alignSelf ?? 'auto'};
  background-color: ${({ backgroundColor }) => backgroundColor ?? 'transparent'};
  justify-content: ${({ justifyContent }) => justifyContent ?? 'flex-start'};
  elevation: ${({ elevation }) => elevation ?? 0};
  border-radius: ${({ borderRadius }) => borderRadius ?? 0}px;

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
  ${({ gap }) => getGapStyle(gap)}
  ${(props) => spacings(props)}
`;

export const Row = styled(Block)`
  flex-direction: row;
` as React.ComponentType<BlockProps>;
