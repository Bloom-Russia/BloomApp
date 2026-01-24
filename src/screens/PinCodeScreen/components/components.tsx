import { Block, Colors, ERounding, ESize, ESpacings, Row } from '@UIKit';
import { Image, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { KeyButtonProps, PinDotProps } from '../types';

// ============================================
// STYLED COMPONENTS
// ============================================

export const StyledImage = styled(Image)({
  width: 120,
  height: 120,
});

export const PinDotsContainer = styled(Row)({
  justifyContent: 'center',
  marginBottom: 40,
  gap: ESpacings.s16,
});

export const PinDot = styled(Block)<PinDotProps>((props) => ({
  width: ESize.s20,
  height: ESize.s20,
  borderRadius: ERounding.r100,
  backgroundColor: props.filled ? Colors.white : 'transparent',
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));

export const KeyboardContainer = styled(Block)({
  width: '100%',
  alignSelf: 'center',
  alignItems: 'center',
});

export const KeyboardRow = styled(Row)({
  justifyContent: 'center',
  marginBottom: ESpacings.s16,
  gap: ESpacings.s32,
});

export const BiometricIcon = styled(Block)<KeyButtonProps>((props) => ({
  opacity: props.disabled ? 0.5 : 1,
}));

export const BiometricKeyButton = styled.TouchableOpacity<KeyButtonProps>((props) => ({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: props.disabled ? 0.3 : 1,
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));

export const DeleteButtonInRow = styled.TouchableOpacity<KeyButtonProps>((props) => ({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: props.disabled ? 0.3 : 1,
  borderWidth: 2,
  borderColor: Colors.white,
}));

export const DeleteIcon = styled.Text<KeyButtonProps>((props) => ({
  fontSize: ESize.s32,
  color: props.disabled ? Colors.gray : Colors.white,
}));

export const ResetButton = styled(Pressable).attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))({
  marginBottom: ESpacings.s32,
});
