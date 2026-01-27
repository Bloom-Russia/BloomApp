import { Colors, ERounding, ESize, Typography } from '@UIKit';
import { VIBRATION_DURATION } from '@utils';
import React, { useCallback } from 'react';
import { Vibration } from 'react-native';
import styled from 'styled-components/native';
import { KeyButtonProps } from '../types';

type Props = {
  number: string;
  isLocked?: boolean;
  onPress: (value: string) => void;
};

export const KeyButton: React.FC<Props> = ({ isLocked, number, onPress }) => {
  const onPressHandler = useCallback(() => {
    if (!isLocked) {
      Vibration.vibrate(VIBRATION_DURATION.SHORT);
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
