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
  ScreenContainer,
  Typography,
} from '@UIKit';
import React, { JSX, memo, useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, Vibration } from 'react-native';
import styled from 'styled-components/native';
import { KeyButton } from './components/KeyButton';

// ============================================
// КОНСТАНТЫ ВИБРАЦИИ
// ============================================

const VIBRATION_DURATION = {
  SHORT: 50, // Короткая вибрация для кнопок
  MEDIUM: 100, // Средняя вибрация для особых действий
  LONG: 200, // Длинная вибрация для важных событий
  ERROR: 300, // Вибрация для ошибок
};

// ============================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ВИБРАЦИИ
// ============================================

const vibrate = (durationOrPattern: number | number[]) => {
  if (Platform.OS === 'ios') {
    // iOS поддерживает только предопределенные паттерны или кастомные
    if (typeof durationOrPattern === 'number') {
      Vibration.vibrate(durationOrPattern);
    } else {
      Vibration.vibrate(durationOrPattern, false);
    }
  } else {
    // Android поддерживает и продолжительность и паттерны
    Vibration.vibrate(durationOrPattern);
  }
};

// ============================================
// ENUMS
// ============================================

enum PinMode {
  ENTER = 'enter',
  SET = 'set',
  CONFIRM = 'confirm',
}

type KeyButtonProps = {
  disabled: boolean;
};

// ============================================
// STYLED COMPONENTS
// ============================================

const StyledImage = styled(Image)({
  width: 120,
  height: 120,
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
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));

const KeyboardContainer = styled(Block)({
  width: '100%',
  alignSelf: 'center',
  alignItems: 'center',
});

const KeyboardRow = styled(Row)({
  justifyContent: 'center',
  marginBottom: ESpacings.s16,
  gap: ESpacings.s32,
});

const BiometricIcon = styled(Block)<KeyButtonProps>((props) => ({
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
  borderColor: 'rgba(255, 255, 255, 0.5)',
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

const ExitButton = styled.TouchableOpacity<KeyButtonProps>(() => ({
  width: ESize.s72,
  height: ESize.s72,
  borderRadius: ERounding.r100,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.5)',
}));

const ResetButton = styled(Pressable).attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.ripple,
  },
}))({
  marginBottom: ESpacings.s32,
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedPin, setSavedPin] = useState<string | undefined>(undefined); // В реальном приложении это должно быть из хранилища

  const biometricAvailable = true;
  const isBiometricLocked = false;

  // ============================================
  // ЭФФЕКТЫ
  // ============================================

  useEffect(() => {
    // Определяем начальный режим
    const initialMode = savedPin ? PinMode.ENTER : PinMode.SET;
    setPinMode(initialMode);
  }, [savedPin]);

  const handleEnterPin = useCallback(() => {
    if (currentPin === savedPin) {
      // Правильный PIN-код - вибрация успеха
      console.log('Вход успешен');
      setErrorMessage('');

      // В реальном приложении здесь навигация к основному экрану
      Alert.alert('Успех', 'Вход выполнен успешно!');

      // Сброс состояния
      setTimeout(() => {
        setCurrentPin('');
      }, 500);
    } else {
      // Неправильный PIN-код - вибрация ошибки
      console.log('Неверный PIN-код');
      setErrorMessage('Неверный PIN-код. Попробуйте снова.');

      // Сброс текущего ввода
      setTimeout(() => {
        setCurrentPin('');
      }, 500);
    }
  }, [currentPin, savedPin]);

  const handleConfirmPin = useCallback(() => {
    if (currentPin === confirmPin) {
      // PIN-коды совпадают - вибрация успеха
      console.log('PIN-код успешно установлен:', currentPin);
      setSavedPin(currentPin); // Сохраняем PIN (в реальном приложении - в хранилище)
      setCurrentPin('');
      setConfirmPin('');
      setErrorMessage('');

      // Переходим в режим ввода для проверки
      setPinMode(PinMode.ENTER);

      Alert.alert('Успех', 'PIN-код успешно установлен!');
    } else {
      // PIN-коды не совпадают - вибрация ошибки
      console.log('PIN-коды не совпадают');
      setErrorMessage('PIN-коды не совпадают. Попробуйте снова.');
      setConfirmPin('');

      // Сбрасываем в режим установки
      setTimeout(() => {
        setPinMode(PinMode.SET);
        setCurrentPin('');
      }, 1000);
    }
  }, [confirmPin, currentPin]);

  useEffect(() => {
    // Обработка ввода пин-кода
    if (pinMode === PinMode.SET && currentPin.length === 4) {
      // PIN введен полностью, переходим к подтверждению
      setTimeout(() => {
        setPinMode(PinMode.CONFIRM);
        setErrorMessage(''); // Сбрасываем ошибку при переходе к подтверждению
      }, 300);
    } else if (pinMode === PinMode.CONFIRM && confirmPin.length === 4) {
      // Подтверждающий PIN введен полностью
      handleConfirmPin();
    } else if (pinMode === PinMode.ENTER && currentPin.length === 4) {
      // PIN введен в режиме входа
      handleEnterPin();
    }
  }, [currentPin, confirmPin, pinMode, handleConfirmPin, handleEnterPin]);

  // ============================================
  // ОБРАБОТЧИКИ С ВИБРАЦИЕЙ
  // ============================================

  const handleNumberPress = (number: string): void => {
    if (isLocked) {
      return;
    }

    if (pinMode === PinMode.CONFIRM) {
      if (confirmPin.length < 4) {
        setConfirmPin((prev) => prev + number);
      }
    } else {
      if (currentPin.length < 4) {
        setCurrentPin((prev) => prev + number);
      }
    }

    return;
  };

  const handleDeletePress = (): void => {
    console.log('Удаление символа');

    // Вибрация при удалении
    vibrate(VIBRATION_DURATION.SHORT);

    if (isLocked) {
      return;
    }

    if (pinMode === PinMode.CONFIRM) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setCurrentPin((prev) => prev.slice(0, -1));
    }
  };

  const handleBiometricAuthWithVibration = (): void => {
    console.log('Биометрическая аутентификация');

    // Вибрация при попытке биометрии
    vibrate(VIBRATION_DURATION.MEDIUM);

    // В реальном приложении здесь вызов биометрической аутентификации
    Alert.alert('Биометрия', 'Биометрическая аутентификация выполнена успешно!');
  };

  const handleBiometricAuthWhenLockedWithVibration = (): void => {
    console.log('Биометрическая аутентификация при блокировке');

    // Вибрация при попытке биометрии в заблокированном состоянии
    vibrate(VIBRATION_DURATION.MEDIUM);
  };

  const { logOutHandler } = useLogOut();

  const handleExitAppWithVibration = async (): Promise<void> => {
    console.log('Выход из приложения');

    // Вибрация при выходе
    vibrate(VIBRATION_DURATION.LONG);
    await logOutHandler();
  };

  const handleResetPinWithVibration = (): void => {
    console.log('Сброс PIN-кода');

    // Вибрация при нажатии на сброс
    vibrate(VIBRATION_DURATION.MEDIUM);

    Alert.alert('Сброс PIN-кода', 'Вы уверены, что хотите сбросить PIN-код?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Сбросить',
        style: 'destructive',
        onPress: () => {
          // Вибрация при подтверждении сброса
          setSavedPin(undefined);
          setPinMode(PinMode.SET);
          setCurrentPin('');
          setConfirmPin('');
          setErrorMessage('');
        },
      },
    ]);
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
    <ScreenContainer scrollEnabled={false}>
      <Block flex={1}>
        <Block alignItems="center">
          <StyledImage source={RoundLogoAppImage} />
        </Block>
        <Block flex={1} padding={ESpacings.s16} alignItems="center">
          <Block alignItems="center" marginBottom={ESpacings.s32}>
            <Typography.R24 color={Colors.white} textAlign="center" marginBottom={ESpacings.s8}>
              {getTitle()}
            </Typography.R24>
            <Typography.R14 color={Colors.textSecondary} textAlign="center">
              {getSubtitle()}
            </Typography.R14>
          </Block>

          {errorMessage && (
            <Block marginBottom={ESpacings.s24}>
              <Typography.R14 color={Colors.error} textAlign="center">
                {errorMessage}
              </Typography.R14>
            </Block>
          )}
          {renderPinDots()}
          {pinMode === PinMode.ENTER && savedPin && !isLocked && (
            <ResetButton
              onPress={handleResetPinWithVibration}
              onPressIn={() => vibrate(VIBRATION_DURATION.SHORT)}
            >
              <Typography.B14 color={Colors.primary}>Забыли PIN?</Typography.B14>
            </ResetButton>
          )}
        </Block>
      </Block>
      <KeyboardContainer>
        {/* Первый ряд: 1 2 3 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'1'} isLocked={isLocked} />
          <KeyButton onPress={handleNumberPress} number={'2'} isLocked={isLocked} />
          <KeyButton onPress={handleNumberPress} number={'3'} isLocked={isLocked} />
        </KeyboardRow>

        {/* Второй ряд: 4 5 6 */}
        <KeyboardRow>
          <KeyboardRow>
            <KeyButton onPress={handleNumberPress} number={'4'} isLocked={isLocked} />
            <KeyButton onPress={handleNumberPress} number={'5'} isLocked={isLocked} />
            <KeyButton onPress={handleNumberPress} number={'6'} isLocked={isLocked} />
          </KeyboardRow>
        </KeyboardRow>

        {/* Третий ряд: 7 8 9 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'7'} isLocked={isLocked} />
          <KeyButton onPress={handleNumberPress} number={'8'} isLocked={isLocked} />
          <KeyButton onPress={handleNumberPress} number={'9'} isLocked={isLocked} />
        </KeyboardRow>

        {/* Четвертый ряд: Выход 0 Биометрия/Удаление */}
        <KeyboardRow>
          <ExitButton
            disabled={false}
            onPress={handleExitAppWithVibration}
            onPressIn={() => vibrate(VIBRATION_DURATION.SHORT)}
          >
            <Block>
              <Icon size={ESize.s28} color={Colors.white} name={IconNames.signOut} />
            </Block>
          </ExitButton>
          <KeyButton onPress={handleNumberPress} number={'0'} isLocked={isLocked} />
          {getActionButton()}
        </KeyboardRow>
      </KeyboardContainer>
    </ScreenContainer>
  );
});
