import { CustomAlertConfig, useLogOut } from '@hooks';
import { IconNames } from '@UIKit';
import { VIBRATION_DURATION } from '@utils';
import { useCallback } from 'react';
import { Vibration } from 'react-native';

export const useHandleExitApp = (showAlert: (config: CustomAlertConfig) => void) => {
  const { logOutHandler } = useLogOut();

  const handleExitApp = useCallback(async (): Promise<void> => {
    Vibration.vibrate(VIBRATION_DURATION.SHORT);
    showAlert({
      title: 'Выход из приложения',
      message: 'Вы уверены, что хотите выйти из приложения?',
      type: 'error',
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
          text: 'Выйти',
          style: 'default',
          showButtonIcon: true,
          buttonIconName: IconNames.signOut,
          onPress: async () => {
            await logOutHandler();
          },
        },
      ],
    });
  }, [showAlert, logOutHandler]);

  return {
    handleExitApp,
  };
};
