import { useAuth } from '@contexts';
import { useErrorWithTimeout } from '@hooks';
import { ApiClientService, SecureStorageService } from '@services';
import { useUserStore } from '@store';
import { useCallback } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

export const useLogOut = (setIsLoading: (value: boolean) => void) => {
  const { setIsVerified } = useAuth();
  const { clearUserData } = useUserStore();
  const { setErrorMessageWithTimeout } = useErrorWithTimeout();

  const logOutHandler = useCallback(async () => {
    const { success } = await ApiClientService.logOutWithToken({
      options: {
        changeLoading: setIsLoading,
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });
    if (success) {
      await clearUserData();

      try {
        const biometrics = new ReactNativeBiometrics();
        const { keysExist } = await biometrics.biometricKeysExist();
        if (keysExist) {
          await biometrics.deleteKeys();
        }
      } catch (error) {
        console.error('Ошибка удаления биометрических ключей:', error);
      }

      await SecureStorageService.clearAll();

      await setIsVerified(false);
    } else {
      console.error('Ошибка выхода из системы.');
    }
  }, [clearUserData, setErrorMessageWithTimeout, setIsLoading, setIsVerified]);

  return { logOutHandler };
};
