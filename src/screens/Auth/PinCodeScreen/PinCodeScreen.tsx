// PinCodeScreen.tsx
import { RoundLogoAppImage } from '@assets/images';
import { useCustomAlert } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { Block, Colors, ESpacings, Row, ScreenContainer, Typography } from '@UIKit';
import { vibrate, VIBRATION_DURATION } from '@utils';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';

import {
  ExitButton,
  KeyboardContainer,
  KeyboardRow,
  KeyButton,
  ResetButton,
  StyledDots,
  StyledImage,
} from './components';
import { ERROR_TIMEOUT } from './constants';
import {
  useGetActionButton,
  useHandleExitApp,
  useHandleResetPin,
  useLoadPinCodeData,
} from './hooks';
import { useTitle } from './hooks/useTitle';
import { PinMode } from './types';

const PinCodeScreenComponent: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(() => {
  const [pinMode, setPinMode] = useState<PinMode>(PinMode.SET);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPinCodeSet, setIsPinCodeSet] = useState<boolean>(false);
  const [confirmPin, setConfirmPin] = useState<string>(''); // Для хранения PIN-кода при подтверждении
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Флаг блокировки во время обработки

  // Рефы для хранения таймеров
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { AlertComponent, showAlert } = useCustomAlert();

  // Хук для загрузки данных о PIN-коде
  const { loadPinCodeData } = useLoadPinCodeData({ setIsPinCodeSet, setPinMode });

  // Функция для очистки ошибки (только при удалении или размонтировании)
  const clearErrorMessage = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setErrorMessage('');
  }, []);

  // Функция для установки ошибки с автоматическим скрытием
  const setErrorMessageWithTimeout = useCallback((message: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setErrorMessage(message);

    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage('');
      errorTimeoutRef.current = null;
    }, ERROR_TIMEOUT);
  }, []);

  // Функция ввода PIN-кода для входа
  const handleEnterPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      try {
        const { success, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );
        if (!success || !phoneNumber) {
          // Показываем сообщение об ошибке
          setErrorMessageWithTimeout('Номер телефона не найден!');
          setCurrentPin('');
          setIsProcessing(false);
          return;
        }

        await ApiClientService.verifyPinCode({
          phoneNumber,
          pinCode: pin,
        });

        // Успешная верификация - сбрасываем состояние
        setCurrentPin('');
        setConfirmPin('');
        setIsPinCodeSet(true);
        setIsProcessing(false);
      } catch (error) {
        console.error('Ошибка верификации PIN:', error);
        setErrorMessageWithTimeout('Неверный PIN-код');
        setCurrentPin(''); // Очищаем PIN при ошибке
        setIsProcessing(false);
        vibrate(VIBRATION_DURATION.ERROR);
      }
    },
    [setErrorMessageWithTimeout],
  );

  // Функция подтверждения установки PIN-кода
  const handleConfirmPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      try {
        const { success, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );
        if (!success || !phoneNumber) {
          setErrorMessageWithTimeout('Номер телефона не найден!');
          setIsProcessing(false);
          return;
        }

        await ApiClientService.savePinCode({
          phoneNumber,
          pinCode: pin,
        });

        // Успешное сохранение - блокируем дальнейший ввод
        setCurrentPin('');
        setConfirmPin('');
        setIsPinCodeSet(true);
        // Не меняем pinMode, чтобы показать, что PIN установлен
        setIsProcessing(false);
      } catch (error) {
        console.error('Ошибка сохранения PIN:', error);
        setErrorMessageWithTimeout('Ошибка сохранения PIN-кода');
        setCurrentPin('');
        setConfirmPin('');
        setPinMode(PinMode.SET); // Возвращаемся к установке PIN
        setIsProcessing(false);
      }
    },
    [setErrorMessageWithTimeout],
  );

  // Функция обработки завершенного PIN-кода
  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (isProcessing) {
        return;
      } // Если уже обрабатывается, игнорируем

      try {
        switch (pinMode) {
          case PinMode.SET:
            // Сохраняем введенный PIN и переходим к подтверждению
            setConfirmPin(pin);
            setPinMode(PinMode.CONFIRM);
            setCurrentPin('');
            break;

          case PinMode.CONFIRM:
            // Проверяем совпадение PIN-кодов
            if (pin === confirmPin) {
              await handleConfirmPin(pin);
            } else {
              setErrorMessageWithTimeout('PIN-коды не совпадают');
              vibrate(VIBRATION_DURATION.ERROR);
              setPinMode(PinMode.SET);
              setCurrentPin('');
              setConfirmPin('');
            }
            break;

          case PinMode.ENTER:
            if (pin.length === 4) {
              await handleEnterPin(pin);
            }
            break;
        }
      } catch (error) {
        console.error('Ошибка обработки PIN:', error);
        setErrorMessageWithTimeout('Ошибка обработки PIN-кода');
        setCurrentPin('');
        setIsProcessing(false);
      }
    },
    [
      pinMode,
      confirmPin,
      handleEnterPin,
      handleConfirmPin,
      setErrorMessageWithTimeout,
      isProcessing,
    ],
  );

  // Функция для обработки удаления символа
  const handleDeletePress = useCallback((): void => {
    if (isProcessing) {
      return;
    } // Блокируем удаление во время обработки

    vibrate(VIBRATION_DURATION.SHORT);

    if (currentPin.length > 0) {
      setCurrentPin((prev) => prev.slice(0, -1));
    }

    clearErrorMessage();
  }, [currentPin, clearErrorMessage, isProcessing]);

  // Функция для обработки ввода цифры
  const handleNumberPress = useCallback(
    (number: string) => {
      if (isProcessing) {
        return;
      } // Блокируем ввод во время обработки

      if (currentPin.length < 4) {
        const newPin = currentPin + number;
        setCurrentPin(newPin);
        vibrate(VIBRATION_DURATION.SHORT);

        // Автоматическая обработка после ввода 4 цифр
        if (newPin.length === 4) {
          setTimeout(async () => {
            await handlePinComplete(newPin);
          }, 100);
        }
      }
    },
    [currentPin, handlePinComplete, isProcessing],
  );

  // Функция для отображения точек PIN-кода
  const renderPinDots = useCallback(() => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <StyledDots
          key={i}
          backgroundColor={i < currentPin.length ? Colors.white : 'transparent'}
        />,
      );
    }
    return (
      <Row justifyContent="center" marginBottom={40} gap={ESpacings.s16}>
        {dots}
      </Row>
    );
  }, [currentPin]);

  // HOOKS
  const { handleExitApp } = useHandleExitApp(showAlert);
  const { handleResetPin } = useHandleResetPin({
    clearErrorMessage,
    showAlert,
  });
  const { getSubtitle, getTitle } = useTitle(pinMode);
  const { getActionButton } = useGetActionButton({
    handleDeletePress,
    hasEnteredSymbols: currentPin.length > 0,
  });

  // Эффект для загрузки данных о PIN-коде
  useEffect(() => {
    const loadData = async () => {
      await loadPinCodeData();
    };
    loadData().then((result) => console.log(result));
  }, [loadPinCodeData]);

  // Очищаем таймеры при размонтировании
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Обработчик сброса PIN-кода
  const handleReset = useCallback(() => {
    if (isProcessing) {
      return;
    }

    try {
      handleResetPin();
      // После успешного сброса обновляем состояние
      setPinMode(PinMode.SET);
      setIsPinCodeSet(false);
      setCurrentPin('');
      setConfirmPin('');
      setIsProcessing(false);
    } catch (error) {
      console.error('Ошибка при сбросе PIN:', error);
    }
  }, [handleResetPin, isProcessing]);

  return (
    <ScreenContainer scrollEnabled={false}>
      <Block flex={1}>
        <Block alignItems="center" marginTop={ESpacings.s32}>
          <StyledImage source={RoundLogoAppImage} />
        </Block>

        <Block flex={1} padding={ESpacings.s16} alignItems="center" justifyContent="center">
          <Block alignItems="center" marginBottom={ESpacings.s32}>
            <Typography.R24 color={Colors.white} textAlign="center" marginBottom={ESpacings.s8}>
              {getTitle()}
            </Typography.R24>
            <Typography.R14 color={Colors.textSecondary} textAlign="center">
              {getSubtitle()}
            </Typography.R14>
          </Block>

          {renderPinDots()}

          {errorMessage ? (
            <Block marginBottom={ESpacings.s24}>
              <Typography.R14 color={Colors.error} textAlign="center">
                {errorMessage}
              </Typography.R14>
            </Block>
          ) : (
            isPinCodeSet &&
            pinMode !== PinMode.ENTER && (
              <ResetButton onPress={handleReset}>
                <Typography.B14 color={Colors.primary}>Забыли PIN?</Typography.B14>
              </ResetButton>
            )
          )}
        </Block>
      </Block>

      <KeyboardContainer>
        {/* Первый ряд: 1 2 3 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'1'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'2'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'3'} isLocked={isProcessing} />
        </KeyboardRow>

        {/* Второй ряд: 4 5 6 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'4'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'5'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'6'} isLocked={isProcessing} />
        </KeyboardRow>

        {/* Третий ряд: 7 8 9 */}
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'7'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'8'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'9'} isLocked={isProcessing} />
        </KeyboardRow>

        {/* Четвертый ряд: Выход 0 Удаление/Биометрия */}
        <KeyboardRow>
          <ExitButton handleExitApp={handleExitApp} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'0'} isLocked={isProcessing} />
          {getActionButton()}
        </KeyboardRow>
      </KeyboardContainer>

      <AlertComponent />
    </ScreenContainer>
  );
});

export const PinCodeScreen = memo(PinCodeScreenComponent, isEqual);
