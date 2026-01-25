import { useCustomAlert } from '@hooks';
import { SecureStorageKeys, SecureStorageService } from '@services';
import { IconNames } from '@UIKit';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { VIBRATION_DURATION } from '../constants';
import { PinMode } from '../types';
import { vibrate } from '../utils';

type PinProps = {
  isProcessing: boolean;
  isLocked: boolean;
  clearErrorMessage: () => void;
  resetFailedAttempts: () => void;
  setSavedPin: (pin: string | undefined) => void;
  setIsPinCodeSet: (value: boolean) => void;
  setPinMode: (mode: PinMode) => void;
  setCurrentPin: (pin: string) => void;
  setConfirmPin: (pin: string) => void;
};

export const useHandleResetPin = ({
  isProcessing,
  isLocked,
  clearErrorMessage,
  resetFailedAttempts,
  setSavedPin,
  setIsPinCodeSet,
  setPinMode,
  setCurrentPin,
  setConfirmPin,
}: PinProps) => {
  const { showAlert } = useCustomAlert();

  const handleResetPin = useCallback(() => {
    if (isProcessing || isLocked) {
      return;
    }
    // При сбросе PIN-кода сбрасываем ошибку
    clearErrorMessage();
    resetFailedAttempts(); // Сбрасываем счетчик неудачных попыток

    // Вибрация при нажатии на сброс
    vibrate(VIBRATION_DURATION.MEDIUM);

    showAlert({
      title: 'Сброс PIN-кода',
      message: 'Вы уверены, что хотите сбросить PIN-код?',
      type: 'question',
      theme: 'dark',
      showIcon: true,
      buttons: [
        {
          text: 'Отмена',
          style: 'cancel',
          showButtonIcon: true,
          buttonIconName: IconNames.cancel,
        },
        {
          text: 'Сбросить',
          style: 'default',
          showButtonIcon: true,
          buttonIconName: IconNames.signOut,
          onPress: async () => {
            try {
              await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
              // Сбрасываем состояние
              setSavedPin(undefined);
              setIsPinCodeSet(false);
              setPinMode(PinMode.SET);
              setCurrentPin('');
              setConfirmPin('');
              resetFailedAttempts(); // Сбрасываем счетчик неудачных попыток
              clearErrorMessage();

              Alert.alert('Успех', 'PIN-код успешно сброшен. Установите новый PIN-код.');
            } catch (error) {
              console.error('Ошибка при сбросе PIN-кода:', error);
              Alert.alert('Ошибка', 'Не удалось сбросить PIN-код');
            }
          },
        },
      ],
    });
  }, [
    isProcessing,
    isLocked,
    clearErrorMessage,
    resetFailedAttempts,
    showAlert,
    setSavedPin,
    setIsPinCodeSet,
    setPinMode,
    setCurrentPin,
    setConfirmPin,
  ]);

  return {
    handleResetPin,
  };
};
