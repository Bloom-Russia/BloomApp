import { useAuth } from '@contexts';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { useUserStore } from '@store';
import { useCallback } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

export const useLogOut = () => {
  const { setIsVerified, isVerified } = useAuth();
  const { clearUserData } = useUserStore();

  const logOutHandler = useCallback(async () => {
    const phoneNumber = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
    if (phoneNumber.success && phoneNumber.data) {
      const result = await ApiClientService.logOutWithToken({ phoneNumber: phoneNumber.data });
      if (result?.success) {
        clearUserData();

        try {
          const biometrics = new ReactNativeBiometrics();
          const { keysExist } = await biometrics.biometricKeysExist();
          if (keysExist) {
            await biometrics.deleteKeys();
            console.log('✅ Биометрические ключи удалены при выходе');
          }
        } catch (error) {
          console.error('Ошибка удаления биометрических ключей:', error);
        }

        await SecureStorageService.clearAll();

        await setIsVerified(!isVerified);
      }
    } else {
      console.error('Ошибка выхода из системы, номер телефона не найден.');
    }
  }, [clearUserData, isVerified, setIsVerified]);

  return { logOutHandler };
};
