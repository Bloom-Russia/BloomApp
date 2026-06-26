import { Block, ERounding, ESize, ESpacings } from '@UIKit';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);

export const Touchable = styled.TouchableOpacity``;
export const TextBase = styled.Text``;
export const TextInputBase = styled.TextInput``;

export const Backdrop = styled(Touchable).attrs(() => ({
  activeOpacity: 1,
}))(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
}));

export const BackdropView = styled(Block)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

export const Overlay = styled(Block)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
});

export interface AlertContainerProps {
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  shadow?: boolean;
  shadowStyle?: {
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
  };
}

export const AlertContainer = styled(Block).attrs(() => ({}))<AlertContainerProps>(
  ({ backgroundColor, borderColor, borderRadius, shadow, shadowStyle }) => ({
    width: ALERT_WIDTH,
    borderWidth: 1,
    overflow: 'hidden',
    padding: ESpacings.s24,
    backgroundColor,
    borderColor,
    borderRadius,
    shadowColor: shadow ? shadowStyle?.shadowColor || '#000' : 'transparent',
    shadowOffset: shadow
      ? shadowStyle?.shadowOffset || { width: 0, height: 4 }
      : { width: 0, height: 0 },
    shadowOpacity: shadow ? shadowStyle?.shadowOpacity || 0.1 : 0,
    shadowRadius: shadow ? shadowStyle?.shadowRadius || ESize.s12 : 0,
    elevation: shadow ? shadowStyle?.elevation || 8 : 0,
  }),
);

export const IconContainer = styled(Block)({
  alignItems: 'center',
  marginBottom: ESpacings.s16,
});

export const ContentContainer = styled(Block)({
  alignItems: 'center',
});

interface Title20Props {
  color: string;
  align?: 'left' | 'center' | 'right';
}

export const Title20 = styled(TextBase).attrs(() => ({}))<Title20Props>(
  ({ color, align = 'center' }) => ({
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: ESpacings.s8,
    color,
    textAlign: align,
  }),
);

interface MessageProps {
  color: string;
  align?: 'left' | 'center' | 'right';
}

export const Message = styled(TextBase).attrs(() => ({}))<MessageProps>(
  ({ color, align = 'center' }) => ({
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: ESpacings.s16,
    color,
    textAlign: align,
  }),
);

interface InputFieldProps {
  borderColor: string;
  color: string;
  backgroundColor: string;
}

export const InputField = styled(TextInputBase).attrs(() => ({
  placeholderTextColor: '#999',
}))<InputFieldProps>(({ borderColor, color, backgroundColor }) => ({
  width: '100%',
  height: 48,
  borderWidth: 1,
  borderRadius: ERounding.r8,
  paddingHorizontal: 16,
  fontSize: 16,
  marginBottom: ESpacings.s16,
  borderColor,
  color,
  backgroundColor,
}));

interface DividerProps {
  color: string;
}

export const Divider = styled(Block).attrs(() => ({}))<DividerProps>(({ color }) => ({
  height: 1,
  width: '100%',
  opacity: 0.2,
  marginVertical: ESpacings.s20,
  backgroundColor: color,
}));

export const ButtonIcon = styled(Block)({
  marginRight: ESpacings.s8,
});

export const ButtonsContainer = styled(Block)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
});

interface StyledButtonProps {
  backgroundColor: string;
  disabled?: boolean;
  marginLeft?: number;
  showIcon?: boolean;
}

export const StyledButton = styled(Touchable).attrs<StyledButtonProps>(({ disabled }) => ({
  activeOpacity: disabled ? 1 : 0.7,
  disabled,
}))<StyledButtonProps>(({ backgroundColor, disabled, marginLeft = 0, showIcon }) => ({
  flex: 1,
  height: 48,
  backgroundColor: disabled ? '#cccccc' : backgroundColor,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft,
  flexDirection: showIcon ? 'row' : 'column',
}));

interface ButtonTextProps {
  textColor: string;
  disabled?: boolean;
  hasIcon?: boolean;
}

export const ButtonText = styled(TextBase).attrs<ButtonTextProps>(() => ({}))<ButtonTextProps>(
  ({ textColor, disabled, hasIcon = false }) => ({
    fontSize: 16,
    fontWeight: '600',
    color: disabled ? '#666666' : textColor,
    marginLeft: hasIcon ? ESpacings.s4 : 0,
  }),
);
