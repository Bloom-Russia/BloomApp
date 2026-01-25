// useLoadPinCodeData.ts
import { SecureStorageKeys, SecureStorageService } from '@services';
import { PinMode } from 'src/screens/PinCodeScreen/types';

type Props = {
  setIsPinCodeSet: (value: boolean) => void;
  setPinMode: (value: PinMode) => void;
};

// Хук для загрузки данных о PIN-коде
export const useLoadPinCodeData = ({ setIsPinCodeSet, setPinMode }: Props) => {
  const loadPinCodeData = async () => {
    try {
      const isPinSet = await SecureStorageService.getValue(SecureStorageKeys.PIN_CODE_IS_SET);
      setPinMode(isPinSet.success ? PinMode.ENTER : PinMode.SET);
      return setIsPinCodeSet(isPinSet.success);
    } catch (error) {
      console.log('Ошибка загрузки данных PIN:', error);
      return setIsPinCodeSet(false);
    }
  };

  return { loadPinCodeData };
};
