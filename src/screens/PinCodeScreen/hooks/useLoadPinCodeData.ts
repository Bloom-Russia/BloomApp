// useLoadPinCodeData.ts
import { SecureStorageKeys, SecureStorageService } from '@services';
import { useCallback } from 'react';
import { PinMode } from '../types';

type Props = {
  setIsPinCodeSet: (value: boolean) => void;
  setPinMode: (value: PinMode) => void;
};

// Хук для загрузки данных о PIN-коде
export const useLoadPinCodeData = ({ setIsPinCodeSet, setPinMode }: Props) => {
  const loadPinCodeData = useCallback(async () => {
    try {
      const { success, data } = await SecureStorageService.getValue(
        SecureStorageKeys.PIN_CODE_IS_SET,
      );
      setPinMode(success && data === 'true' ? PinMode.ENTER : PinMode.SET);
      return setIsPinCodeSet(success && data === 'true');
    } catch (error) {
      console.log('Ошибка загрузки данных PIN:', error);
      return setIsPinCodeSet(false);
    }
  }, [setIsPinCodeSet, setPinMode]);

  return { loadPinCodeData };
};
