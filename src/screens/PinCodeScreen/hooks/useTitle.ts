import { useCallback } from 'react';
import { PinMode } from '../types';

export const useTitle = (pinMode: PinMode) => {
  const getSubtitle = useCallback((): string => {
    switch (pinMode) {
      case PinMode.SET:
        return 'Установите новый PIN-код для защиты приложения';
      case PinMode.CONFIRM:
        return 'Повторите PIN-код для подтверждения';
      case PinMode.ENTER:
      default:
        return 'Введите PIN-код для входа в приложение';
    }
  }, [pinMode]);

  const getTitle = useCallback((): string => {
    switch (pinMode) {
      case PinMode.SET:
        return 'Установите PIN-код';
      case PinMode.CONFIRM:
        return 'Подтвердите PIN-код';
      case PinMode.ENTER:
      default:
        return 'Введите PIN-код';
    }
  }, [pinMode]);

  return {
    getTitle,
    getSubtitle,
  };
};
