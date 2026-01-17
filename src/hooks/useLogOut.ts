import { useAuth } from '@contexts';
import { SecureStorageService } from '@services';
import { useCallback } from 'react';

export const useLogOut = () => {
  const { setIsVerified, isVerified } = useAuth();

  const logOutHandler = useCallback(async () => {
    await SecureStorageService.clearAll();
    await setIsVerified(!isVerified);
  }, [isVerified, setIsVerified]);

  return { logOutHandler };
};
