// useHandleResetPin.ts
import { CustomAlertConfig } from '@hooks';
import { SecureStorageKeys, SecureStorageService } from '@services';
import { IconNames } from '@UIKit';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { VIBRATION_DURATION } from '../constants';
import { vibrate } from '../utils';

type PinProps = {
  clearErrorMessage: () => void;
  showAlert: (config: CustomAlertConfig) => void;
};

export const useHandleResetPin = ({ clearErrorMessage, showAlert }: PinProps) => {
  const handleResetPin = useCallback(() => {
    // При сбросе PIN-кода сбрасываем ошибку
    clearErrorMessage();

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
              Alert.alert('Успех', 'PIN-код успешно сброшен. Установите новый PIN-код.');
              // Дополнительные действия можно выполнить через колбэк
            } catch (error) {
              console.error('Ошибка при сбросе PIN-кода:', error);
              Alert.alert('Ошибка', 'Не удалось сбросить PIN-код');
            }
          },
        },
      ],
    });
  }, [clearErrorMessage, showAlert]);

  return {
    handleResetPin,
  };
};
