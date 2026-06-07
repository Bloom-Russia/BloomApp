import { useAuth } from '@contexts';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { useCallback } from 'react';

export const useLogOut = () => {
  const { setIsVerified, isVerified } = useAuth();

  const logOutHandler = useCallback(async () => {
    const phoneNumber = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
    if (phoneNumber.success && phoneNumber.data) {
      const result = await ApiClientService.logOutWithToken({ phoneNumber: phoneNumber.data });
      if (result?.success) {
        console.log('Успешный выход из системы');
        await SecureStorageService.clearAll();
        await setIsVerified(!isVerified);
      }
    } else {
      console.log('Ошибка выхода из системы');
    }
  }, [isVerified, setIsVerified]);

  return { logOutHandler };
};
