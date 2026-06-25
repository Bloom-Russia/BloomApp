import { useCustomAlert } from '@hooks';
import { IconNames } from '@UIKit';
import { useCallback, useRef } from 'react';

export const useErrorWithTimeout = () => {
  const { showAlert, hideAlert, AlertComponent } = useCustomAlert();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setErrorMessageWithTimeout = useCallback(
    (message?: string) => {
      showAlert({
        title: message || 'Внутренняя ошибка сервера',
        type: 'error',
        theme: 'dark',
        showIcon: true,
        autoHide: true,
        buttons: [
          {
            text: 'Закрыть',
            style: 'destructive',
            showButtonIcon: true,
            buttonIconName: IconNames.cancel,
          },
        ],
      });
    },
    [showAlert],
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
