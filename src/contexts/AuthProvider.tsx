import { SecureStorageService } from '@services';
import { SecureStorageKeys } from '../services/SecureStorageService';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AuthContextType } from 'src/contexts/types'; // Тип контекста

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVerified, setIsVerifiedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setIsVerified = useCallback(async (value: boolean) => {
    await SecureStorageService.saveValue(SecureStorageKeys.IS_VERIFIED, value);
    setIsVerifiedState(value);
  }, []);

  // Загружаем состояние при монтировании
  useEffect(() => {
    loadVerifiedStatus().then(() => console.log('initializing'));
  }, []);

  const loadVerifiedStatus = async () => {
    try {
      const verified = await SecureStorageService.getValue(SecureStorageKeys.IS_VERIFIED);

      if (verified.success && verified.data !== null) {
        setIsVerifiedState(verified.data === 'true');
      } else {
        setIsVerifiedState(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса верификации:', error);
      setIsVerifiedState(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isVerified, setIsVerified, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('Метод useAuth необходимо использовать внутри AuthProvider.');
  }
  return context;
};

// Экспортируем контекст для использования
export { AuthContext, useAuth };
