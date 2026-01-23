// PinCodeScreen.tsx
import { RoundLogoAppImage } from '@assets/images';
import { useLogOut } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, ESize, Icon, IconNames } from '@UIKit';
import React, { JSX, memo } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

// ============================================
// STYLED COMPONENTS
// ============================================

const Container = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-top: 80px;
  margin-bottom: 20px;
`;

const StyledImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
`;

const MainContainer = styled.View`
  flex: 1;
  padding: 20px;
  align-items: center;
`;

const TitleContainer = styled.View`
  align-items: center;
  margin-bottom: 40px;
`;

const Title24 = styled.Text`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #a0a0c0;
  text-align: center;
  line-height: 22px;
`;

const PinDotsContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 40px;
  gap: 16px;
`;

interface PinDotProps {
  filled: boolean;
}

const PinDot = styled.View<PinDotProps>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${(props) => (props.filled ? '#4a6fa5' : '#2d2d4a')};
  border: 2px solid ${(props) => (props.filled ? '#4a6fa5' : '#3d3d5e')};
`;

const KeyboardContainer = styled.View`
  width: 100%;
  max-width: 320px;
  margin-top: 20px;
`;

const KeyboardRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 20px;
`;

interface KeyButtonProps {
  disabled: boolean;
}

const KeyButton = styled.TouchableOpacity<KeyButtonProps>`
  width: 75px;
  height: 75px;
  border-radius: 37.5px;
  background-color: #2d2d4a;
  justify-content: center;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.3 : 1)};
`;

const KeyText = styled.Text<KeyButtonProps>`
  font-size: 28px;
  font-weight: 500;
  color: ${(props) => (props.disabled ? '#666666' : '#ffffff')};
`;

const EmptyButton = styled.View`
  width: 75px;
  height: 75px;
`;

interface BiometricIconProps {
  disabled: boolean;
}

const BiometricIcon = styled.View<BiometricIconProps>`
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;

const BiometricKeyButton = styled.TouchableOpacity<KeyButtonProps>`
  width: 75px;
  height: 75px;
  border-radius: 37.5px;
  background-color: #2d2d4a;
  justify-content: center;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.3 : 1)};
`;

const DeleteButtonInRow = styled.TouchableOpacity<KeyButtonProps>`
  width: 75px;
  height: 75px;
  border-radius: 37.5px;
  background-color: #2d2d4a;
  justify-content: center;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.3 : 1)};
`;

const DeleteIcon = styled.Text<KeyButtonProps>`
  font-size: 32px;
  color: ${(props) => (props.disabled ? '#666666' : '#ffffff')};
`;

const ExitButton = styled.TouchableOpacity`
  width: 75px;
  height: 75px;
  border-radius: 37.5px;
  background-color: #2d2d4a;
  justify-content: center;
  align-items: center;
`;

const ExitIcon = styled.View`
  transform: rotate(180deg);
`;

const ResetButton = styled.TouchableOpacity`
  margin-bottom: 30px;
  padding: 12px 24px;
`;

const ResetButtonText = styled.Text`
  font-size: 16px;
  color: #4a6fa5;
  text-decoration-line: underline;
`;

const ErrorText = styled.Text`
  font-size: 14px;
  color: #ff6b6b;
  text-align: center;
  margin-bottom: 20px;
  padding: 0 20px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #1a1a2e;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: #ffffff;
  margin-top: 20px;
`;

/**
 * Экран авторизации по PIN-коду с поддержкой биометрии
 */
export const PinCodeScreen: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(({ navigation }) => {
  // ============================================
  // СОСТОЯНИЕ КОМПОНЕНТА (заглушки)
  // ============================================
  const pinMode: 'enter' | 'set' | 'confirm' = 'enter';
  const currentPin = '';
  const confirmPin = '';
  const isLocked = false;
  const hasEnteredSymbols = false;
  const errorMessage = '';
  const biometricAvailable = true;
  const isBiometricLocked = false;
  const savedPin = undefined;

  // ============================================
  // ОБРАБОТЧИКИ (заглушки)
  // ============================================
  const handleNumberPress = (number: string): void => {
    console.log('Нажата цифра:', number);
  };

  const handleDeletePress = (): void => {
    console.log('Удаление символа');
  };

  const handleBiometricAuthWithVibration = (): void => {
    console.log('Биометрическая аутентификация');
  };

  const handleBiometricAuthWhenLockedWithVibration = (): void => {
    console.log('Биометрическая аутентификация при блокировке');
  };

  const { logOutHandler } = useLogOut();

  const handleExitAppWithVibration = async (): void => {
    console.log('Выход из приложения');
    await logOutHandler();
  };

  const handleResetPinWithVibration = (): void => {
    console.log('Сброс PIN-кода');
  };

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ
  // ============================================
  const getSubtitle = (): string => {
    if (isLocked) {
      return 'Повторите через 30 секунд';
    }

    if (pinMode === 'set') {
      return 'Установите новый PIN-код для защиты приложения';
    } else if (pinMode === 'confirm') {
      return 'Повторите PIN-код для подтверждения';
    } else {
      return 'Введите PIN-код для входа в приложение';
    }
  };

  const getTitle = (): string => {
    if (isLocked) {
      return 'Доступ заблокирован';
    }

    if (pinMode === 'set') {
      return 'Установите PIN-код';
    } else if (pinMode === 'confirm') {
      return 'Подтвердите PIN-код';
    } else {
      return 'Введите PIN-код';
    }
  };

  const renderPinDots = (): JSX.Element => {
    // При блокировке всегда показываем пустые точки
    if (isLocked) {
      const dots: JSX.Element[] = [];
      for (let i = 0; i < 6; i++) {
        dots.push(<PinDot key={i} filled={false} />);
      }
      return <PinDotsContainer>{dots}</PinDotsContainer>;
    }

    const length = pinMode === 'confirm' ? confirmPin.length : currentPin.length;
    const dots: JSX.Element[] = [];

    for (let i = 0; i < 6; i++) {
      const isFilled = i < length;
      dots.push(<PinDot key={i} filled={isFilled} />);
    }

    return <PinDotsContainer>{dots}</PinDotsContainer>;
  };

  const getActionButton = (): JSX.Element => {
    // На заблокированном экране показываем кнопку биометрии
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
      <>
        <LogoContainer>
          <StyledImage source={RoundLogoAppImage} />
        </LogoContainer>

        <MainContainer>
          <TitleContainer>
            <Title24>{getTitle()}</Title24>
            <Subtitle>{getSubtitle()}</Subtitle>
          </TitleContainer>

          {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

          {isBiometricLocked && <ErrorText>Биометрия заблокирована</ErrorText>}

          {renderPinDots()}

          {pinMode === 'enter' && savedPin && !isLocked && (
            <ResetButton onPress={handleResetPinWithVibration}>
              <ResetButtonText>Забыли PIN?</ResetButtonText>
            </ResetButton>
          )}

          <KeyboardContainer>
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

            <KeyboardRow>
              <EmptyButton />
              <ExitButton onPress={handleExitAppWithVibration}>
                <ExitIcon>
                  <Icon size={ESize.s28} color={Colors.white} name={IconNames.signOut} />
                </ExitIcon>
              </ExitButton>
              <KeyButton onPress={() => handleNumberPress('0')} disabled={isLocked}>
                <KeyText disabled={isLocked}>0</KeyText>
              </KeyButton>
              {getActionButton()}
              <EmptyButton />
            </KeyboardRow>
          </KeyboardContainer>
        </MainContainer>
      </>
    </Container>
  );
});
