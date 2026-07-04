import i18n, { initI18n } from '@core/i18n';
import { noop } from 'lodash';
import React, { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initI18n();
      setIsInitialized(true);
    };
    init().then(noop);
  }, []);

  if (!isInitialized) {
    // Можно показать спиннер или null
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
