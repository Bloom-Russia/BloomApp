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
      const { success, data: phoneNumber } = await SecureStorageService.getValue(
        SecureStorageKeys.PHONE_NUMBER,
      );
      if (!success || !phoneNumber) {
        // Показываем сообщение об ошибке
        setErrorMessageWithTimeout('Номер телефона не найден!');
        return;
      }
      // Сбрасываем состояние PIN
      setCurrentPin('');
      setConfirmPin('');
      setIsPinCodeSet(true);

      await ApiClientService.verifyPinCode({
        phoneNumber,
        pinCode: pin,
      });
    },
    [setErrorMessageWithTimeout],
  );

  // Функция подтверждения установки PIN-кода
  const handleConfirmPin = useCallback(
    async (pin: string) => {
      const { success, data: phoneNumber } = await SecureStorageService.getValue(
        SecureStorageKeys.PHONE_NUMBER,
      );
      if (!success || !phoneNumber) {
        setErrorMessageWithTimeout('Номер телефона не найден!');
        return;
      }
      // Сбрасываем состояние PIN
      setCurrentPin('');
      setConfirmPin('');
      setIsPinCodeSet(true);

      await ApiClientService.savePinCode({
        phoneNumber,
        pinCode: pin,
      });
    },
    [setErrorMessageWithTimeout],
  );

  // Функция обработки завершенного PIN-кода
  const handlePinComplete = useCallback(
    async (pin: string) => {
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
      }
    },
    [pinMode, confirmPin, handleEnterPin, handleConfirmPin, setErrorMessageWithTimeout],
  );

  // Функция для обработки удаления символа
  const handleDeletePress = useCallback((): void => {
    vibrate(VIBRATION_DURATION.SHORT);

    if (currentPin.length > 0) {
      setCurrentPin((prev) => prev.slice(0, -1));
    }

    clearErrorMessage();
  }, [currentPin, clearErrorMessage]);

  // Функция для обработки ввода цифры
  const handleNumberPress = useCallback(
    (number: string) => {
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
    [currentPin, handlePinComplete],
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
    try {
      handleResetPin();
      // После успешного сброса обновляем состояние
      setPinMode(PinMode.SET);
      setIsPinCodeSet(false);
      setCurrentPin('');
      setConfirmPin('');
    } catch (error) {
      console.error('Ошибка при сбросе PIN:', error);
    }
  }, [handleResetPin]);

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
            isPinCodeSet && (
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
          <KeyButton onPress={() => handleNumberPress('1')} number={'1'} />
          <KeyButton onPress={() => handleNumberPress('2')} number={'2'} />
          <KeyButton onPress={() => handleNumberPress('3')} number={'3'} />
        </KeyboardRow>

        {/* Второй ряд: 4 5 6 */}
        <KeyboardRow>
          <KeyButton onPress={() => handleNumberPress('4')} number={'4'} />
          <KeyButton onPress={() => handleNumberPress('5')} number={'5'} />
          <KeyButton onPress={() => handleNumberPress('6')} number={'6'} />
        </KeyboardRow>

        {/* Третий ряд: 7 8 9 */}
        <KeyboardRow>
          <KeyButton onPress={() => handleNumberPress('7')} number={'7'} />
          <KeyButton onPress={() => handleNumberPress('8')} number={'8'} />
          <KeyButton onPress={() => handleNumberPress('9')} number={'9'} />
        </KeyboardRow>

        {/* Четвертый ряд: Выход 0 Удаление/Биометрия */}
        <KeyboardRow>
          <ExitButton handleExitApp={handleExitApp} />
          <KeyButton onPress={() => handleNumberPress('0')} number={'0'} />
          {getActionButton()}
        </KeyboardRow>
      </KeyboardContainer>

      <AlertComponent />
    </ScreenContainer>
  );
});

export const PinCodeScreen = memo(PinCodeScreenComponent, isEqual);
