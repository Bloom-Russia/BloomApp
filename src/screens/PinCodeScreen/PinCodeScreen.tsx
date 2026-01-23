// PinCodeScreen.tsx
import { RoundLogoAppImage } from '@assets/images';
import { useLogOut } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Block,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  Row,
  Typography,
} from '@UIKit';
import React, { JSX, memo, useState } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

// ============================================
// ENUMS
// ============================================

enum PinMode {
  ENTER = 'enter',
  SET = 'set',
  CONFIRM = 'confirm',
}

// ============================================
// STYLED COMPONENTS
// ============================================

const Container = styled(Block)({
  flex: 1,
  backgroundColor: Colors.black,
});

const MainContent = styled(Block)({
  flex: 1,
  backgroundColor: Colors.black,
  justifyContent: 'space-between',
  padding: ESpacings.s16,
});

const LogoContainer = styled(Block)({
  alignItems: 'center',
  marginTop: 40,
  marginBottom: ESpacings.s20,
});

const StyledImage = styled.Image({
  width: 120,
  height: 120,
});

const ContentContainer = styled(Block)({
  flex: 1,
  padding: ESpacings.s20,
  alignItems: 'center',
  justifyContent: 'center',
});

const TitleContainer = styled(Block)({
  alignItems: 'center',
  marginBottom: 40,
});

const PinDotsContainer = styled(Row)({
  justifyContent: 'center',
  marginBottom: 40,
  gap: ESpacings.s16,
});

interface PinDotProps {
  filled: boolean;
}

const PinDot = styled(Block)<PinDotProps>((props) => ({
  width: ESize.s20,
  height: ESize.s20,
  borderRadius: ERounding.r100,
  backgroundColor: props.filled ? Colors.white : 'transparent',
  borderWidth: 2,
  borderColor: Colors.white,
}));

const KeyboardContainer = styled(Block)({
  width: '100%',
  alignSelf: 'center',
  alignItems: 'center',
  marginTop: 'auto',
  marginBottom: 40,
});

const KeyboardRow = styled(Row)({
  justifyContent: 'center',
  marginBottom: ESpacings.s16,
  gap: ESpacings.s32,
});

interface KeyButtonProps {
  disabled: boolean;
}

const KeyButton = styled.TouchableOpacity<KeyButtonProps>((props) => ({
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

const KeyText = styled.Text<KeyButtonProps>((props) => ({
  fontSize: ESize.s28,
  fontWeight: '500',
  color: props.disabled ? Colors.gray : Colors.white,
}));

interface BiometricIconProps {
  disabled: boolean;
}

const BiometricIcon = styled(Block)<BiometricIconProps>((props) => ({
  opacity: props.disabled ? 0.5 : 1,
}));

const BiometricKeyButton = styled.TouchableOpacity<KeyButtonProps>((props) => ({
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

const DeleteButtonInRow = styled.TouchableOpacity<KeyButtonProps>((props) => ({
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

const DeleteIcon = styled.Text<KeyButtonProps>((props) => ({
  fontSize: ESize.s32,
  color: props.disabled ? Colors.gray : Colors.white,
}));

const ExitButton = styled.TouchableOpacity({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: Colors.white,
});

const ResetButton = styled.TouchableOpacity({
  marginBottom: ESpacings.s32,
  paddingVertical: ESpacings.s12,
  paddingHorizontal: ESpacings.s24,
});

/**
 * Экран авторизации по PIN-коду с поддержкой биометрии
 */
export const PinCodeScreen: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(() => {
  // ============================================
  // СОСТОЯНИЕ КОМПОНЕНТА
  // ============================================
  const [pinMode, setPinMode] = useState<PinMode>(PinMode.ENTER);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLocked] = useState<boolean>(false);
  const [errorMessage] = useState<string>('');

  const biometricAvailable = true;
  const isBiometricLocked = false;
  const savedPin = undefined;

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================
  const handleNumberPress = (number: string): void => {
    console.log('Нажата цифра:', number);

    if (pinMode === PinMode.CONFIRM) {
      if (confirmPin.length < 4) {
        setConfirmPin((prev) => prev + number);
      }
    } else {
      if (currentPin.length < 4) {
        setCurrentPin((prev) => prev + number);
      }
    }
  };

  const handleDeletePress = (): void => {
    console.log('Удаление символа');

    if (pinMode === PinMode.CONFIRM) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setCurrentPin((prev) => prev.slice(0, -1));
    }
  };

  const handleBiometricAuthWithVibration = (): void => {
    console.log('Биометрическая аутентификация');
  };

  const handleBiometricAuthWhenLockedWithVibration = (): void => {
    console.log('Биометрическая аутентификация при блокировке');
  };

  const { logOutHandler } = useLogOut();

  const handleExitAppWithVibration = async (): Promise<void> => {
    console.log('Выход из приложения');
    await logOutHandler();
  };

  const handleResetPinWithVibration = (): void => {
    console.log('Сброс PIN-кода');
    setPinMode(PinMode.SET);
    setCurrentPin('');
    setConfirmPin('');
  };

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ
  // ============================================
  const getSubtitle = (): string => {
    if (isLocked) {
      return 'Повторите через 30 секунд';
    }

    switch (pinMode) {
      case PinMode.SET:
        return 'Установите новый PIN-код для защиты приложения';
      case PinMode.CONFIRM:
        return 'Повторите PIN-код для подтверждения';
      case PinMode.ENTER:
      default:
        return 'Введите PIN-код для входа в приложение';
    }
  };

  const getTitle = (): string => {
    if (isLocked) {
      return 'Доступ заблокирован';
    }

    switch (pinMode) {
      case PinMode.SET:
        return 'Установите PIN-код';
      case PinMode.CONFIRM:
        return 'Подтвердите PIN-код';
      case PinMode.ENTER:
      default:
        return 'Введите PIN-код';
    }
  };

  const renderPinDots = (): JSX.Element => {
    if (isLocked) {
      const dots: JSX.Element[] = [];
      for (let i = 0; i < 4; i++) {
        dots.push(<PinDot key={i} filled={false} />);
      }
      return <PinDotsContainer>{dots}</PinDotsContainer>;
    }

    const length = pinMode === PinMode.CONFIRM ? confirmPin.length : currentPin.length;
    const dots: JSX.Element[] = [];

    for (let i = 0; i < 4; i++) {
      const isFilled = i < length;
      dots.push(<PinDot key={i} filled={isFilled} />);
    }

    return <PinDotsContainer>{dots}</PinDotsContainer>;
  };

  const getActionButton = (): JSX.Element => {
    if (isLocked) {
      return (
        <BiometricKeyButton
          onPress={handleBiometricAuthWhenLockedWithVibration}
          disabled={!biometricAvailable || isBiometricLocked}
        >
          <BiometricIcon disabled={!biometricAvailable || isBiometricLocked}>
            <Icon
              size={ESize.s40}
              color={!biometricAvailable || isBiometricLocked ? Colors.gray : Colors.white}
              name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
            />
          </BiometricIcon>
        </BiometricKeyButton>
      );
    } else {
      // Определяем, есть ли введенные символы
      const hasEnteredSymbols =
        pinMode === PinMode.CONFIRM ? confirmPin.length > 0 : currentPin.length > 0;

      if (hasEnteredSymbols) {
        return (
          <DeleteButtonInRow onPress={handleDeletePress} disabled={false}>
            <DeleteIcon disabled={false}>⌫</DeleteIcon>
          </DeleteButtonInRow>
        );
      } else {
        return (
          <BiometricKeyButton
            onPress={handleBiometricAuthWithVibration}
            disabled={!biometricAvailable || isBiometricLocked}
          >
            <BiometricIcon disabled={!biometricAvailable || isBiometricLocked}>
              <Icon
                size={ESize.s40}
                color={!biometricAvailable || isBiometricLocked ? Colors.gray : Colors.white}
                name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
              />
            </BiometricIcon>
          </BiometricKeyButton>
        );
      }
    }
  };

  // ============================================
  // ОСНОВНОЙ РЕНДЕРИНГ
  // ============================================
  return (
    <Container>
      <MainContent>
        <LogoContainer>
          <StyledImage source={RoundLogoAppImage} />
        </LogoContainer>

        <ContentContainer>
          <TitleContainer>
            <Typography.R24 color={Colors.white} textAlign="center" marginBottom={ESpacings.s8}>
              {getTitle()}
            </Typography.R24>
            <Typography.R14 color={Colors.textSecondary} textAlign="center">
              {getSubtitle()}
            </Typography.R14>
          </TitleContainer>

          {errorMessage && (
            <Typography.R14 color={Colors.error} textAlign="center" marginBottom={ESpacings.s20}>
              {errorMessage}
            </Typography.R14>
          )}

          {isBiometricLocked && (
            <Typography.R14 color={Colors.error} textAlign="center">
              Биометрия заблокирована
            </Typography.R14>
          )}

          {renderPinDots()}

          {pinMode === PinMode.ENTER && savedPin && !isLocked && (
            <ResetButton onPress={handleResetPinWithVibration}>
              <Typography.R14 color={Colors.primary}>Забыли PIN?</Typography.R14>
            </ResetButton>
          )}
        </ContentContainer>

        <KeyboardContainer>
          {/* Первый ряд: 1 2 3 */}
          <KeyboardRow>
            <KeyButton onPress={() => handleNumberPress('1')} disabled={isLocked}>
              <KeyText disabled={isLocked}>1</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('2')} disabled={isLocked}>
              <KeyText disabled={isLocked}>2</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('3')} disabled={isLocked}>
              <KeyText disabled={isLocked}>3</KeyText>
            </KeyButton>
          </KeyboardRow>

          {/* Второй ряд: 4 5 6 */}
          <KeyboardRow>
            <KeyButton onPress={() => handleNumberPress('4')} disabled={isLocked}>
              <KeyText disabled={isLocked}>4</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('5')} disabled={isLocked}>
              <KeyText disabled={isLocked}>5</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('6')} disabled={isLocked}>
              <KeyText disabled={isLocked}>6</KeyText>
            </KeyButton>
          </KeyboardRow>

          {/* Третий ряд: 7 8 9 */}
          <KeyboardRow>
            <KeyButton onPress={() => handleNumberPress('7')} disabled={isLocked}>
              <KeyText disabled={isLocked}>7</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('8')} disabled={isLocked}>
              <KeyText disabled={isLocked}>8</KeyText>
            </KeyButton>
            <KeyButton onPress={() => handleNumberPress('9')} disabled={isLocked}>
              <KeyText disabled={isLocked}>9</KeyText>
            </KeyButton>
          </KeyboardRow>

          {/* Четвертый ряд: Выход 0 Биометрия/Удаление */}
          <KeyboardRow>
            <ExitButton onPress={handleExitAppWithVibration}>
              <Block>
                <Icon size={ESize.s28} color={Colors.white} name={IconNames.signOut} />
              </Block>
            </ExitButton>

            <KeyButton onPress={() => handleNumberPress('0')} disabled={isLocked}>
              <KeyText disabled={isLocked}>0</KeyText>
            </KeyButton>

            {getActionButton()}
          </KeyboardRow>
        </KeyboardContainer>
      </MainContent>
    </Container>
  );
});
