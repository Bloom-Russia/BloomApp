import { Colors, ERounding, ESize, Typography } from '@UIKit';
import React, { useCallback } from 'react';
import styled from 'styled-components/native';

type Props = {
  number: string;
  isLocked: boolean;
  onPress: (value: string) => void;
};

type KeyButtonProps = {
  disabled: boolean;
};

export const KeyButton: React.FC<Props> = ({ isLocked, number, onPress }) => {
  const onPressHandler = useCallback(() => {
    onPress(number);
  }, [onPress, number]);

  return (
    <StyledKeyButton onPress={onPressHandler} disabled={isLocked}>
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
