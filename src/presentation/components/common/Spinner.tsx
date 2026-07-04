import { Colors } from '@core/styles';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Block } from './Block';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'large', color = Colors.primary }) => {
  return (
    <Block
      flex={1}
      backgroundColor={Colors.backgroundPrimary}
      justifyContent="center"
      alignItems="center"
    >
      <ActivityIndicator size={size} color={color} />
    </Block>
  );
};
