import { Colors, ERounding, SpacingsProps } from '@core/styles';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import styled from 'styled-components';

import { Block } from './Block';
import { Typography } from './Typography';

interface ButtonProps extends SpacingsProps {
  title: string | undefined;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  paddingHorizontal?: number;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  color,
  textColor = Colors.white,
  onPress,
  disabled,
  loading,
  paddingHorizontal = 0,
  variant = 'primary',
  ...props
}) => {
  const onPressHandler = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    onPress();
  }, [disabled, loading, onPress]);

  const getBackgroundColor = () => {
    if (disabled) {
      return Colors.borderSecondary;
    }
    if (color) {
      return color;
    }
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.backgroundSecondary;
      case 'outline':
        return Colors.transparent;
      case 'danger':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return Colors.textTertiary;
    }
    if (variant === 'outline') {
      return Colors.primary;
    }
    return textColor;
  };

  return (
    <Block {...props}>
      <StyledPressable
        backgroundColor={getBackgroundColor()}
        isOutline={variant === 'outline'}
        disabled={disabled || loading}
        onPress={onPressHandler}
      >
        {loading ? (
          <ActivityIndicator size="large" color={getTextColor()} />
        ) : (
          <Typography.B14 paddingHorizontal={paddingHorizontal} color={getTextColor()}>
            {title}
          </Typography.B14>
        )}
      </StyledPressable>
    </Block>
  );
};

const StyledPressable = styled(Pressable).attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.black,
  },
}))<{ backgroundColor: string; isOutline: boolean; disabled?: boolean }>(
  ({ backgroundColor, isOutline, disabled }) => ({
    flexDirection: 'row',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    opacity: disabled ? 0.5 : 1,
    backgroundColor: backgroundColor,
    borderRadius: ERounding.r12,
    borderWidth: isOutline ? 1 : 0,
    borderColor: isOutline ? Colors.primary : Colors.transparent,
  }),
);
