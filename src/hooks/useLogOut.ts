import { useAuth } from '@contexts';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { useCallback } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

export const useLogOut = () => {
  const { setIsVerified, isVerified } = useAuth();

  const logOutHandler = useCallback(async () => {
    const phoneNumber = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
    if (phoneNumber.success && phoneNumber.data) {
      const result = await ApiClientService.logOutWithToken({ phoneNumber: phoneNumber.data });
      if (result?.success) {
        console.log('Успешный выход из системы');

        // Очищаем биометрические ключи ДО clearAll
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

        // Очищаем все данные из SecureStorage (включая BIOMETRIC_ENABLED и BIOMETRIC_SETUP_COMPLETED и ONBOARDING_COMPLETED)
        await SecureStorageService.clearAll();

        // Обновляем состояние авторизации
        await setIsVerified(!isVerified);
      }
    } else {
      console.log('Ошибка выхода из системы');
    }
  }, [isVerified, setIsVerified]);

  return { logOutHandler };
};
