import { useErrorWithTimeout } from '@hooks';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { useCallback, useEffect } from 'react';
import { PinMode } from '../types';

type Props = {
  setIsPinCodeSet: (value: boolean) => void;
  setPinMode: (value: PinMode) => void;
  setLoading: (value: boolean) => void;
};

export const useLoadPinCodeData = ({ setIsPinCodeSet, setPinMode, setLoading }: Props) => {
  const { setErrorMessageWithTimeout, cleanupErrors } = useErrorWithTimeout();

  useEffect(() => cleanupErrors, [cleanupErrors]);

  const loadPinCodeData = useCallback(async () => {
    try {
      const { success, data } = await ApiClientService.checkPinStatus({
        options: {
          changeLoading: setLoading,
          errorCodeCallBack: setErrorMessageWithTimeout,
        },
      });

      // ✅ Приводим к boolean (false если undefined)
      const hasPin = !!(success && data?.hasPin);

      setPinMode(hasPin ? PinMode.ENTER : PinMode.SET);
      setIsPinCodeSet(hasPin);

      if (hasPin) {
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, 'true');
      } else {
        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      }
    } catch (error) {
      console.error('Ошибка loadPinCodeData:', error);
      setPinMode(PinMode.SET);
      setIsPinCodeSet(false);
      await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
    }
  }, [setErrorMessageWithTimeout, setIsPinCodeSet, setLoading, setPinMode]);

  return { loadPinCodeData };
};
