// PinCodeScreen.tsx
import { RoundLogoAppImage } from '@assets/images';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SecureStorageKeys, SecureStorageService } from '@services';
import {
  Block,
  Colors,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  ScreenContainer,
  Typography,
} from '@UIKit';
import React, { JSX, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import {
  BiometricIcon,
  BiometricKeyButton,
  DeleteButtonInRow,
  DeleteIcon,
  ExitButton,
  KeyboardContainer,
  KeyboardRow,
  KeyButton,
  Loading,
  PinDot,
  PinDotsContainer,
  ResetButton,
  StyledImage,
} from './components';
import {
  ERROR_TIMEOUT,
  LOCK_DURATION,
  MAX_ATTEMPTS,
  PIN_INPUT_DELAY,
  VIBRATION_DURATION,
} from './constants';
import {
  useHandleConfirmPin,
  useHandleExitApp,
  useHandleNumberPress,
  useHandleResetPin,
} from './hooks';
import { PinMode } from './types';
import { vibrate } from './utils';

export const PinCodeScreen: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(() => {
  const [pinMode, setPinMode] = useState<PinMode>(PinMode.ENTER);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false); // Состояние блокировки
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedPin, setSavedPin] = useState<string | undefined>(undefined); // Сохраненный PIN-код
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Флаг для отслеживания обработки PIN-кода
  const [failedAttempts, setFailedAttempts] = useState<number>(0); // Счетчик неудачных попыток
  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(false); // Блокировка биометрии
  const [isPinCodeSet, setIsPinCodeSet] = useState<boolean>(false); // Флаг, установлен ли PIN-код
  const [isLoading, setIsLoading] = useState<boolean>(true); // Флаг загрузки данных

  // Рефы для хранения таймеров
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pinProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const biometricAvailable = true;

  // Функция для установки ошибки с автоматическим скрытием
  const setErrorMessageWithTimeout = useCallback((message: string) => {
    // Очищаем предыдущий таймер, если он есть
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Устанавливаем новое сообщение об ошибке
    setErrorMessage(message);

    // Устанавливаем таймер для автоматического скрытия ошибки
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage('');
      errorTimeoutRef.current = null;
    }, ERROR_TIMEOUT);
  }, []);

  // Функция для установки сообщения об ошибке блокировки с таймером
  const setLockErrorMessage = useCallback((secondsLeft: number) => {
    const message = `Доступ заблокирован. Повторите через ${secondsLeft} секунд`;
    setErrorMessage(message);
  }, []);

  // Функция для очистки ошибки
  const clearErrorMessage = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setErrorMessage('');
  }, []);

  // Функция для очистки всех таймеров
  const clearAllTimeouts = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    if (pinProcessingTimeoutRef.current) {
      clearTimeout(pinProcessingTimeoutRef.current);
      pinProcessingTimeoutRef.current = null;
    }

    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    if (lockIntervalRef.current) {
      clearInterval(lockIntervalRef.current);
      lockIntervalRef.current = null;
    }
  }, []);

  // Функция для запуска блокировки
  const startLockTimer = useCallback(() => {
    setIsLocked(true);
    setIsBiometricLocked(true); // Блокируем биометрию тоже

    // Устанавливаем начальное сообщение об ошибке
    const initialSecondsLeft = Math.ceil(LOCK_DURATION / 1000);
    setLockErrorMessage(initialSecondsLeft);

    let currentTimeLeft = LOCK_DURATION;

    // Запускаем таймер обратного отсчета
    lockIntervalRef.current = setInterval(() => {
      currentTimeLeft -= 1000;

      if (currentTimeLeft <= 0) {
        // Таймер завершен
        if (lockIntervalRef.current) {
          clearInterval(lockIntervalRef.current);
          lockIntervalRef.current = null;
        }

        setIsLocked(false);
        setIsBiometricLocked(false); // Разблокируем биометрию
        setFailedAttempts(0); // Сбрасываем счетчик попыток
        clearErrorMessage(); // Сбрасываем сообщение об ошибке
        return;
      }

      const secondsLeft = Math.ceil(currentTimeLeft / 1000);
      setLockErrorMessage(secondsLeft);
    }, 1000);

    // Основной таймер блокировки
    lockTimerRef.current = setTimeout(() => {
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
      }

      setIsLocked(false);
      setIsBiometricLocked(false); // Разблокируем биометрию
      setFailedAttempts(0); // Сбрасываем счетчик попыток
      clearErrorMessage(); // Сбрасываем сообщение об ошибке
    }, LOCK_DURATION);
  }, [clearErrorMessage, setLockErrorMessage]);

  // Функция для обработки неудачной попытки
  const handleFailedAttempt = useCallback(() => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);

    // Проверяем, достигли ли мы максимального количества попыток
    if (newFailedAttempts >= MAX_ATTEMPTS) {
      // Запускаем блокировку
      startLockTimer();

      // Вибрация для блокировки
      vibrate([0, VIBRATION_DURATION.ERROR, VIBRATION_DURATION.MEDIUM, VIBRATION_DURATION.ERROR]);
    } else {
      setErrorMessageWithTimeout('Неверный PIN-код');

      // Вибрация ошибки
      vibrate(VIBRATION_DURATION.ERROR);
    }
  }, [failedAttempts, startLockTimer, setErrorMessageWithTimeout]);

  // Функция для сброса счетчика неудачных попыток
  const resetFailedAttempts = useCallback(() => {
    setFailedAttempts(0);
    setIsBiometricLocked(false); // Сбрасываем блокировку биометрии при сбросе попыток
  }, []);

  // Функция для загрузки данных о PIN-коде
  const loadPinCodeData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Проверяем, установлен ли PIN-код
      const isPinSet = await SecureStorageService.getValue(SecureStorageKeys.PIN_CODE_IS_SET);

      setIsPinCodeSet(isPinSet.success);

      if (isPinSet.success) {
        // Если PIN-код установлен
        setPinMode(PinMode.ENTER);
      } else {
        // Если PIN-код не установлен
        setPinMode(PinMode.SET);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных PIN-кода:', error);
      // По умолчанию показываем экран установки PIN-кода
      setPinMode(PinMode.SET);
      setIsPinCodeSet(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    loadPinCodeData();
  }, [loadPinCodeData]);

  // Эффект для определения начального режима
  useEffect(() => {
    if (!isLoading) {
      // Сбрасываем счетчик неудачных попыток при изменении режима
      resetFailedAttempts();
    }
  }, [isLoading, resetFailedAttempts]);

  const handleEnterPin = useCallback(() => {
    setIsProcessing(true);

    if (currentPin === savedPin) {
      // Правильный PIN-код - вибрация успеха
      console.log('Вход успешен');
      clearErrorMessage();
      resetFailedAttempts(); // Сбрасываем счетчик неудачных попыток

      // В реальном приложении здесь навигация к основному экрану
      Alert.alert('Успех', 'Вход выполнен успешно!');

      // Вибрация успеха
      vibrate(VIBRATION_DURATION.LONG);

      // Сброс состояния с небольшой задержкой для лучшего UX
      setTimeout(() => {
        setCurrentPin('');
        setIsProcessing(false);
      }, PIN_INPUT_DELAY);
    } else {
      // Неправильный PIN-код
      console.log('Неверный PIN-код');

      // Обрабатываем неудачную попытку
      handleFailedAttempt();

      // Сброс текущего ввода с задержкой
      setTimeout(() => {
        setCurrentPin('');
        setIsProcessing(false);
      }, PIN_INPUT_DELAY);
    }
  }, [currentPin, savedPin, clearErrorMessage, resetFailedAttempts, handleFailedAttempt]);

  const { handleExitApp } = useHandleExitApp();

  const { handleConfirmPin } = useHandleConfirmPin({
    setIsPinCodeSet,
    pinProcessingTimeoutRef,
    setIsProcessing,
    currentPin,
    setCurrentPin,
    confirmPin,
    setConfirmPin,
    setPinMode,
    clearErrorMessage,
    resetFailedAttempts,
    setErrorMessageWithTimeout,
    setSavedPin,
  });

  const { handleResetPin } = useHandleResetPin({
    isLocked,
    isProcessing,
    clearErrorMessage,
    resetFailedAttempts,
    setIsPinCodeSet,
    setSavedPin,
    setConfirmPin,
    setPinMode,
    setCurrentPin,
  });

  const { handleNumberPress } = useHandleNumberPress({
    isProcessing,
    setCurrentPin,
    setConfirmPin,
    pinMode,
    confirmPin,
    currentPin,
    clearErrorMessage,
    isLocked,
  });

  useEffect(() => {
    // Очищаем все таймеры при размонтировании компонента
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  useEffect(() => {
    // Обработка ввода пин-кода с задержкой
    if (pinMode === PinMode.SET && currentPin.length === 4 && !isProcessing) {
      // PIN введен полностью, переходим к подтверждению с задержкой
      setIsProcessing(true);

      pinProcessingTimeoutRef.current = setTimeout(() => {
        setPinMode(PinMode.CONFIRM);
        clearErrorMessage(); // Сбрасываем ошибку при переходе к подтверждению
        setIsProcessing(false);
      }, PIN_INPUT_DELAY);
    } else if (pinMode === PinMode.CONFIRM && confirmPin.length === 4 && !isProcessing) {
      // Подтверждающий PIN введен полностью с задержкой
      setIsProcessing(true);

      pinProcessingTimeoutRef.current = setTimeout(() => {
        handleConfirmPin();
      }, PIN_INPUT_DELAY);
    } else if (pinMode === PinMode.ENTER && currentPin.length === 4 && !isProcessing && !isLocked) {
      // PIN введен в режиме входа с задержкой (только если не заблокировано)
      setIsProcessing(true);

      pinProcessingTimeoutRef.current = setTimeout(() => {
        handleEnterPin();
      }, PIN_INPUT_DELAY);
    }
  }, [
    currentPin,
    confirmPin,
    pinMode,
    handleConfirmPin,
    handleEnterPin,
    clearErrorMessage,
    isProcessing,
    isLocked,
  ]);

  const handleDeletePress = useCallback((): void => {
    if (isLocked || isProcessing) {
      return;
    }

    console.log('Удаление символа');

    // Вибрация при удалении
    vibrate(VIBRATION_DURATION.SHORT);

    // При удалении символа также сбрасываем ошибку
    clearErrorMessage();

    if (pinMode === PinMode.CONFIRM) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setCurrentPin((prev) => prev.slice(0, -1));
    }
  }, [clearErrorMessage, isLocked, isProcessing, pinMode]);

  const handleBiometricAuthWithVibration = useCallback((): void => {
    if (isProcessing || isLocked || isBiometricLocked) {
      return;
    }

    console.log('Биометрическая аутентификация');

    // При попытке биометрии сбрасываем ошибку
    clearErrorMessage();
    resetFailedAttempts(); // Сбрасываем счетчик неудачных попыток при успешной биометрии

    // Вибрация при попытке биометрии
    vibrate(VIBRATION_DURATION.MEDIUM);

    // В реальном приложении здесь вызов биометрической аутентификации
    Alert.alert('Биометрия', 'Биометрическая аутентификация выполнена успешно!');
  }, [isProcessing, isLocked, isBiometricLocked, clearErrorMessage, resetFailedAttempts]);

  const handleBiometricAuthWhenLockedWithVibration = useCallback((): void => {
    if (isProcessing || isBiometricLocked) {
      return;
    }

    console.log('Биометрическая аутентификация при блокировке');

    // При попытке биометрии в заблокированном состоянии сбрасываем ошибку
    clearErrorMessage();

    // Вибрация при попытке биометрии в заблокированном состоянии
    vibrate(VIBRATION_DURATION.MEDIUM);

    // В реальном приложении здесь можно разрешить биометрию даже при блокировке
    // Alert.alert('Биометрия', 'Биометрическая аутентификация выполнена успешно даже при блокировке!');
  }, [isProcessing, isBiometricLocked, clearErrorMessage]);

  const getSubtitle = useCallback((): string => {
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
  }, [isLocked, pinMode]);

  const getTitle = useCallback((): string => {
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
  }, [isLocked, pinMode]);

  const renderPinDots = useCallback((): JSX.Element => {
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
  }, [isLocked, pinMode, confirmPin, currentPin]);

  const getActionButton = useCallback((): JSX.Element => {
    if (isLocked) {
      return (
        <BiometricKeyButton
          onPress={handleBiometricAuthWhenLockedWithVibration}
          disabled={!biometricAvailable || isBiometricLocked || isProcessing}
        >
          <BiometricIcon disabled={!biometricAvailable || isBiometricLocked || isProcessing}>
            <Icon
              size={ESize.s40}
              color={
                !biometricAvailable || isBiometricLocked || isProcessing
                  ? Colors.gray
                  : Colors.white
              }
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
          <DeleteButtonInRow onPress={handleDeletePress} disabled={isProcessing}>
            <DeleteIcon disabled={isProcessing}>⌫</DeleteIcon>
          </DeleteButtonInRow>
        );
      } else {
        return (
          <BiometricKeyButton
            onPress={handleBiometricAuthWithVibration}
            disabled={!biometricAvailable || isBiometricLocked || isProcessing}
          >
            <BiometricIcon disabled={!biometricAvailable || isBiometricLocked || isProcessing}>
              <Icon
                size={ESize.s40}
                color={
                  !biometricAvailable || isBiometricLocked || isProcessing
                    ? Colors.gray
                    : Colors.white
                }
                name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
              />
            </BiometricIcon>
          </BiometricKeyButton>
        );
      }
    }
  }, [
    isLocked,
    handleBiometricAuthWhenLockedWithVibration,
    biometricAvailable,
    isBiometricLocked,
    isProcessing,
    pinMode,
    confirmPin,
    currentPin,
    handleDeletePress,
    handleBiometricAuthWithVibration,
  ]);

  if (isLoading) {
    return <Loading />;
  }

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
          {renderPinDots()}
          {errorMessage && (
            <Block marginBottom={ESpacings.s24}>
              <Typography.R14 color={Colors.error} textAlign="center">
                {errorMessage}
              </Typography.R14>
            </Block>
          )}
          {!errorMessage &&
            pinMode === PinMode.ENTER &&
            isPinCodeSet &&
            !isLocked &&
            !isProcessing && (
              <ResetButton onPress={handleResetPin}>
                <Typography.B14 color={Colors.primary}>Забыли PIN?</Typography.B14>
              </ResetButton>
            )}
        </Block>
      </Block>
      <KeyboardContainer>
        {/* Первый ряд: 1 2 3 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'1'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'2'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'3'} isLocked={isLocked || isProcessing} />
        </KeyboardRow>

        {/* Второй ряд: 4 5 6 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'4'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'5'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'6'} isLocked={isLocked || isProcessing} />
        </KeyboardRow>

        {/* Третий ряд: 7 8 9 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'7'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'8'} isLocked={isLocked || isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'9'} isLocked={isLocked || isProcessing} />
        </KeyboardRow>

        {/* Четвертый ряд: Выход 0 Биометрия/Удаление */}
        <KeyboardRow>
          <ExitButton handleExitApp={handleExitApp} />
          <KeyButton onPress={handleNumberPress} number={'0'} isLocked={isLocked || isProcessing} />
          {getActionButton()}
        </KeyboardRow>
      </KeyboardContainer>
    </ScreenContainer>
  );
});
