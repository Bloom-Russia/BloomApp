import { Colors } from '@core/styles/Colors';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components';

import { Block } from './Block';

interface AbsoluteSpinnerProps {
  color?: string;
  size?: 'small' | 'large';
  opacity?: number;
}

export const AbsoluteSpinner: React.FC<AbsoluteSpinnerProps> = ({
  color = Colors.primary,
  size = 'large',
  opacity = 0.5,
}) => {
  return (
    <AbsoluteWrapper
      flex={1}
      backgroundColor={`rgba(0, 0, 0, ${opacity})`}
      justifyContent="center"
      alignItems="center"
    >
      <ActivityIndicator size={size} color={color} />
    </AbsoluteWrapper>
  );
};

const AbsoluteWrapper = styled(Block)({
  flex: 1,
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});
