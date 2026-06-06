import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { useCallback } from 'react';
import { PinMode } from '../types';

type Props = {
  setIsPinCodeSet: (value: boolean) => void;
  setPinMode: (value: PinMode) => void;
};

export const useLoadPinCodeData = ({ setIsPinCodeSet, setPinMode }: Props) => {
  const loadPinCodeData = useCallback(async () => {
    try {
      const { success: phoneSuccess, data: phoneNumber } = await SecureStorageService.getValue(
        SecureStorageKeys.PHONE_NUMBER,
      );

      if (!phoneSuccess || !phoneNumber) {
        setPinMode(PinMode.SET);
        setIsPinCodeSet(false);

        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
        return;
      }

      const response = await ApiClientService.checkPinStatus({ phoneNumber });

      let hasPin = false;

      if (response?.success && response?.data) {
        hasPin = response.data.hasPin;
      } else if (response?.data.hasPin !== undefined) {
        hasPin = response.data.hasPin;
      }

      setPinMode(hasPin ? PinMode.ENTER : PinMode.SET);
      setIsPinCodeSet(hasPin);

      if (hasPin) {
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, 'true');
      } else {
        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      }
    } catch (error) {
      console.error('❌ Критическая ошибка в loadPinCodeData:', error);
      setPinMode(PinMode.SET);
      setIsPinCodeSet(false);
      await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
    }
  }, [setIsPinCodeSet, setPinMode]);

  return { loadPinCodeData };
};
