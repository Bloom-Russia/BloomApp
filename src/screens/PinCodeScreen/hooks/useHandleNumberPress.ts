import { useCallback } from 'react';
import { VIBRATION_DURATION } from '../constants';
import { PinMode } from '../types';
import { vibrate } from '../utils';

type Props = {
  isLocked: boolean;
  isProcessing: boolean;
  clearErrorMessage: () => void;
  setConfirmPin: (pin: string) => void;
  setCurrentPin: (pin: string) => void;
  pinMode: PinMode;
  confirmPin: string;
  currentPin: string;
};

export const useHandleNumberPress = ({
  isLocked,
  isProcessing,
  clearErrorMessage,
  pinMode,
  confirmPin,
  setConfirmPin,
  currentPin,
  setCurrentPin,
}: Props) => {
  const handleNumberPress = useCallback(
    (number: string) => {
      if (isLocked || isProcessing) {
        return;
      }
      // При вводе новой цифры сбрасываем ошибку
      clearErrorMessage();
      if (pinMode === PinMode.CONFIRM) {
        if (confirmPin.length < 4) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          setConfirmPin((prev: string) => prev + number);
          // Короткая вибрация при вводе цифры
          vibrate(VIBRATION_DURATION.SHORT);
        }
      } else {
        if (currentPin.length < 4) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          setCurrentPin((prev: string) => prev + number);
          // Короткая вибрация при вводе цифры
          vibrate(VIBRATION_DURATION.SHORT);
        }
      }
      return;
    },
    [
      isLocked,
      isProcessing,
      clearErrorMessage,
      pinMode,
      confirmPin.length,
      setConfirmPin,
      currentPin.length,
      setCurrentPin,
    ],
  );
  return {
    handleNumberPress,
  };
};
