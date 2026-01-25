import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { PinMode } from '..//types';
import { vibrate } from '..//utils';
import { PIN_INPUT_DELAY, VIBRATION_DURATION } from '../constants';

type Props = {
  currentPin: string;
  confirmPin: string;
  setIsProcessing: (v: boolean) => void;
  setIsPinCodeSet: (v: boolean) => void;
  setPinMode: (v: PinMode) => void;
  clearErrorMessage: () => void;
  resetFailedAttempts: () => void;
  setConfirmPin: (pin: string) => void;
  setCurrentPin: (pin: string) => void;
  setSavedPin: (pin: string) => void;
  setErrorMessageWithTimeout: (error: string) => void;
  pinProcessingTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
};

export const useHandleConfirmPin = ({
  currentPin,
  confirmPin,
  setIsProcessing,
  clearErrorMessage,
  resetFailedAttempts,
  setConfirmPin,
  setCurrentPin,
  setErrorMessageWithTimeout,
  setSavedPin,
  setIsPinCodeSet,
  setPinMode,
  pinProcessingTimeoutRef,
}: Props) => {
  const handleConfirmPin = useCallback(async () => {
    setIsProcessing(true);
    if (currentPin === confirmPin) {
      clearErrorMessage();
      resetFailedAttempts(); // Сбрасываем счетчик неудачных попыток

      // Вибрация успеха
      vibrate(VIBRATION_DURATION.LONG);

      // Сохраняем PIN-код
      const phone = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
      if (!phone?.data) {
        setErrorMessageWithTimeout('Ошибка: номер телефона не найден');
        setIsProcessing(false);
        return;
      }

      try {
        // Сохраняем PIN-код на сервере
        await ApiClientService.savePinCode({
          phoneNumber: phone.data,
          pinCode: currentPin,
        });

        // Устанавливаем флаг, что PIN-код установлен
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);

        // Обновляем состояние
        setSavedPin(currentPin);
        setIsPinCodeSet(true);
        setPinMode(PinMode.ENTER);

        // Показываем сообщение об успехе
        Alert.alert('Успех', 'PIN-код успешно установлен!');

        // Сброс состояния
        setCurrentPin('');
        setConfirmPin('');
      } catch (error) {
        console.error('Ошибка при сохранении PIN-кода:', error);
        setErrorMessageWithTimeout('Ошибка при сохранении PIN-кода');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // PIN-коды не совпадают - вибрация ошибки
      setErrorMessageWithTimeout('PIN-коды не совпадают. Попробуйте снова.');

      // Вибрация ошибки
      vibrate(VIBRATION_DURATION.ERROR);

      // Сбрасываем в режим установки с задержкой
      pinProcessingTimeoutRef.current = setTimeout(() => {
        setConfirmPin('');
        setIsProcessing(false);
        setPinMode(PinMode.SET);
        setCurrentPin('');
      }, PIN_INPUT_DELAY);
    }
  }, [
    setIsProcessing,
    currentPin,
    confirmPin,
    clearErrorMessage,
    resetFailedAttempts,
    setErrorMessageWithTimeout,
    setSavedPin,
    setIsPinCodeSet,
    setPinMode,
    setCurrentPin,
    setConfirmPin,
    pinProcessingTimeoutRef,
  ]);

  return { handleConfirmPin };
};
