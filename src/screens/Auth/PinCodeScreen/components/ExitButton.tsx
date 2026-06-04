import { Colors, ERounding, ESize, Icon, IconNames } from '@UIKit';
import React from 'react';
import styled from 'styled-components/native';

type Props = {
  handleExitApp: () => void;
  isLocked?: boolean;
};

export const ExitButton: React.FC<Props> = ({ isLocked, handleExitApp }) => {
  return (
    <StyledExitButton disabled={isLocked} onPress={handleExitApp}>
      <Icon size={ESize.s28} color={Colors.white} name={IconNames.signOut} />
    </StyledExitButton>
  );
};

const StyledExitButton = styled.TouchableOpacity(() => ({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));
