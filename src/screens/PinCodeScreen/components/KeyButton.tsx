import { Colors, ERounding, ESize, Typography } from '@UIKit';
import React, { useCallback } from 'react';
import { Vibration } from 'react-native';
import styled from 'styled-components/native';

type Props = {
  number: string;
  isLocked: boolean;
  onPress: (value: string) => void;
};

type KeyButtonProps = {
  disabled: boolean;
};

// Константа для вибрации кнопок
const KEY_BUTTON_VIBRATION = 50; // ms

export const KeyButton: React.FC<Props> = ({ isLocked, number, onPress }) => {
  const onPressHandler = useCallback(() => {
    if (!isLocked) {
      Vibration.vibrate(KEY_BUTTON_VIBRATION);
    }
    onPress(number);
  }, [onPress, number, isLocked]);

  return (
    <StyledKeyButton
      onPress={onPressHandler}
      disabled={isLocked}
      activeOpacity={0.7} // Эффект нажатия
    >
      <Typography.B28 color={isLocked ? Colors.gray : Colors.white}>{number}</Typography.B28>
    </StyledKeyButton>
  );
};

const StyledKeyButton = styled.TouchableOpacity<KeyButtonProps>(({ disabled }) => ({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: disabled ? 0.3 : 1,
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));
