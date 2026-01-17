import { Block, Colors, ESpacings, Typography } from '@UIKit';
import { Dimensions, Image, Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

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

export const Backdrop = styled(Pressable)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

export const BackdropView = styled(Block)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
});

export const AlertContainer = styled(Animated.View)<{
  backgroundColor: string;
  borderColor: string;
}>((props) => ({
  width: Dimensions.get('window').width * 0.85,
  maxWidth: 400,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: props.borderColor,
  backgroundColor: props.backgroundColor,
  padding: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 10,
}));

export const Title20 = styled.Text<{ color: string }>((props) => ({
  fontSize: 20,
  fontWeight: '700',
  marginBottom: 12,
  textAlign: 'center',
  color: props.color,
}));

export const Message = styled.Text<{ color: string }>((props) => ({
  fontSize: 16,
  lineHeight: 22,
  marginBottom: 24,
  textAlign: 'center',
  color: props.color,
}));

export const ButtonsContainer = styled(Block)({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: 12,
});

export const Button = styled.TouchableOpacity.attrs(() => ({
  activeOpacity: 0.7,
}))<{
  isCancel?: boolean;
  isDestructive?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  isLast?: boolean;
}>((props) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
  minWidth: 100,
  backgroundColor: props.backgroundColor || 'transparent',
  borderWidth: props.isCancel ? 1 : 0,
  borderColor: props.borderColor || 'transparent',
  marginRight: props.isLast ? 0 : 0,
}));

export const ButtonIconContainer = styled(Block)({
  marginRight: 8,
});

export const ButtonText = styled.Text<{
  color: string;
  fontWeight: string;
  isDestructive?: boolean;
}>((props) => ({
  fontSize: 16,
  fontWeight: props.fontWeight,
  color: props.color,
}));

export const Container = styled(Block)({
  flex: 1,
  backgroundColor: Colors.black,
  position: 'relative',
});

// Контейнер логотипа
export const LogoContainer = styled(Block)({
  position: 'absolute',
  top: Platform.OS === 'ios' ? 70 : 50,
  left: 0,
  right: 0,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

// Стилизованное изображение логотипа
export const StyledImage = styled(Image)({
  width: 80,
  height: 80,
});

// Основной контейнер контента
export const MainContainer = styled(Block)({
  flex: 1,
  justifyContent: 'space-between',
  paddingHorizontal: ESpacings.s16,
  paddingTop: 150,
  paddingBottom: Platform.OS === 'ios' ? 40 : 30,
});

// Контейнер заголовка
export const TitleContainer = styled(Block)({
  alignItems: 'center',
  marginBottom: ESpacings.s8,
});

// Заголовок - используем R24 (Regular 24px)
export const Title24 = styled(Typography.R24)({
  color: Colors.white,
  marginBottom: ESpacings.s4,
  textAlign: 'center',
});

// Подзаголовок - используем R16 (Regular 16px)
export const Subtitle = styled(Typography.R16)({
  color: Colors.textSecondary,
  textAlign: 'center',
  paddingHorizontal: ESpacings.s16,
});

// Текст ошибки - используем M16 (Medium 16px)
export const ErrorText = styled(Typography.M16)({
  color: Colors.error,
  textAlign: 'center',
  marginTop: ESpacings.s8,
  marginBottom: ESpacings.s16,
  paddingHorizontal: ESpacings.s16,
});

// Контейнер точек PIN-кода
export const PinDotsContainer = styled(Block)({
  flexDirection: 'row',
  justifyContent: 'center',
  marginBottom: ESpacings.s32,
});

// Точка PIN-кода
export const PinDot = styled(Block)<{ filled: boolean }>(({ filled }) => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: filled ? Colors.white : 'rgba(255, 255, 255, 0.1)',
  marginHorizontal: ESpacings.s8,
  justifyContent: 'center',
  alignItems: 'center',
}));

// Кнопка сброса PIN
export const ResetButton = styled.Pressable.attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))(() => ({
  alignSelf: 'center',
  marginBottom: ESpacings.s32,
}));

// Текст кнопки сброса - используем M14 (Medium 14px)
export const ResetButtonText = styled(Typography.M14)({
  color: Colors.primary,
});

// Контейнер клавиатуры
export const KeyboardContainer = styled(Block)({
  paddingBottom: Platform.OS === 'ios' ? 30 : 20,
});

// Ряд клавиатуры
export const KeyboardRow = styled(Block)({
  flexDirection: 'row',
  justifyContent: 'center',
  marginBottom: ESpacings.s12,
});

// Пустая кнопка для выравнивания
export const EmptyButton = styled(Block)({
  width: 70,
  height: 70,
  marginHorizontal: 15,
  opacity: 0,
});

// Кнопка цифры
export const KeyButton = styled.Pressable.attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))<{ disabled?: boolean }>(({ disabled }) => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 15,
  borderWidth: 1,
  borderColor: disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
  opacity: disabled ? 0.5 : 1,
}));

// Текст цифры - используем M16 (Medium 16px)
export const KeyText = styled(Typography.B20)<{ disabled?: boolean }>(({ disabled }) => ({
  color: disabled ? Colors.gray : Colors.white,
}));

// Кнопка биометрии
export const BiometricKeyButton = styled.Pressable.attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))<{ disabled?: boolean }>(({ disabled }) => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 15,
  borderWidth: 1,
  borderColor: disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
  opacity: disabled ? 0.5 : 1,
}));

// Иконка биометрии - используем M16 (Medium 16px)
export const BiometricIcon = styled(Typography.M16)<{ disabled?: boolean }>(({ disabled }) => ({
  color: disabled ? Colors.gray : Colors.white,
}));

// Кнопка удаления
export const DeleteButtonInRow = styled.Pressable.attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))<{ disabled?: boolean }>(({ disabled }) => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 15,
  borderWidth: 1,
  borderColor: disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
  opacity: disabled ? 0.5 : 1,
}));

// Иконка удаления - используем M16 (Medium 16px)
export const DeleteIcon = styled(Typography.M16)<{ disabled?: boolean }>(({ disabled }) => ({
  color: disabled ? Colors.gray : Colors.white,
}));

// Кнопка выхода (всегда активна)
export const ExitButton = styled.Pressable.attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))(() => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 15,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
}));

// Иконка выхода - используем M16 (Medium 16px)
export const ExitIcon = styled(Typography.M16)({
  color: Colors.white,
});

// Контейнер состояния загрузки
export const LoadingContainer = styled(Block)({
  flex: 1,
  backgroundColor: Colors.black,
  justifyContent: 'center',
  alignItems: 'center',
});

// Текст состояния загрузки - используем B20 (Bold 20px)
export const LoadingText = styled(Typography.B20)({
  color: Colors.white,
  marginTop: 20,
});
