import i18n, { initI18n } from '@core/i18n/config';
import React, { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initI18n();
        setIsReady(true);
      } catch (error) {
        console.error('[I18nProvider] Init error:', error);
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
