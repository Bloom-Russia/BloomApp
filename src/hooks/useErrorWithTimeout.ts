// hooks/useErrorWithTimeout.ts
import { useCustomAlert } from '@hooks';
import { IconNames } from '@UIKit';
import { useCallback, useRef } from 'react';
import Config from 'react-native-config';

export const useErrorWithTimeout = () => {
  const { showAlert, hideAlert, AlertComponent } = useCustomAlert();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setErrorMessageWithTimeout = useCallback(
    (message?: string) => {
      // Очищаем предыдущий таймаут
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }

      showAlert({
        title: message || 'Внутренняя ошибка сервера',
        type: 'error',
        theme: 'dark',
        showIcon: true,
        buttons: [
          {
            text: 'Закрыть',
            style: 'destructive',
            showButtonIcon: true,
            buttonIconName: IconNames.cancel,
            onPress: () => {
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
              }
              hideAlert();
            },
          },
        ],
      });

      // Автоматически скрываем через указанное время
      errorTimeoutRef.current = setTimeout(() => {
        hideAlert();
        errorTimeoutRef.current = null;
      }, Number(Config.ERROR_TIMEOUT));
    },
    [hideAlert, showAlert],
  );

  // Функция для ручного скрытия алерта
  const hideError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    hideAlert();
  }, [hideAlert]);

  // Очистка при размонтировании
  const cleanupErrors = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    hideAlert();
  }, [hideAlert]);

  return {
    setErrorMessageWithTimeout,
    hideError,
    cleanupErrors,
    AlertComponent,
    showAlert,
  };
};
