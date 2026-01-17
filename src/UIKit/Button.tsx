import { Block, Colors, ERounding, SpacingsProps, Typography } from '@UIKit';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import styled from 'styled-components';

type Props = {
  title: string | undefined;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
} & SpacingsProps;

export const Button: React.FC<Props> = ({
  title,
  color,
  textColor = Colors.white,
  onPress,
  disabled,
  loading,
  ...props
}) => {
  const onPressHandler = useCallback(() => {
    return disabled || loading ? undefined : onPress();
  }, [disabled, loading, onPress]);

  return (
    <Block {...props}>
      <StyledPressable color={color || 'blue'} disabled={disabled} onPress={onPressHandler}>
        {loading ? (
          <ActivityIndicator size="large" color={'white'} />
        ) : (
          <Typography.B14 color={textColor}>{title}</Typography.B14>
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
}))<{ color: string; disabled?: boolean }>(({ color, disabled }) => ({
  flexDirection: 'row',
  padding: 5,
  alignItems: 'center',
  justifyContent: 'center',
  height: 54,
  opacity: disabled ? 0.5 : 1,
  backgroundColor: color,
  borderRadius: ERounding.r12,
}));
