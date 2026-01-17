import { SecureStorageKeys, SecureStorageResult, SecureStorageService } from '@services';
import { useCallback } from 'react';

// Определяем тип для данных
export interface AnyData {
  key: string | SecureStorageKeys;
  value: string | number | boolean | null | undefined;
}

// Определяем тип возвращаемого значения хука
interface UseSecurityStorageReturn {
  loadingTokens: () => Promise<void>;
  saveResult: (token: string) => Promise<SecureStorageResult>;
  savingUserData: (data: AnyData) => Promise<SecureStorageResult>;
  checkForValuePresence: () => Promise<void>;
  clearAllData: () => Promise<SecureStorageResult>;
}

// Пример использования useSecurityStorage
export const useSecurityStorage = (): UseSecurityStorageReturn => {
  // Сохранение токена
  const saveResult = useCallback(async (token: string): Promise<SecureStorageResult> => {
    return await SecureStorageService.saveAccessToken(token);
  }, []);

  // Загрузка токенов
  const loadingTokens = useCallback(async (): Promise<void> => {
    const tokens = await SecureStorageService.loadTokens();
    if (tokens.success && tokens.data) {
      console.log('Access token:', tokens.data.accessToken);
      console.log('Refresh token:', tokens.data.refreshToken);
    }
  }, []);

  // Сохранение значения
  const savingUserData = useCallback(
    async ({ key, value }: AnyData): Promise<SecureStorageResult> => {
      return await SecureStorageService.saveValue(key, value);
    },
    [],
  );

  // Проверка наличия значения
  const checkForValuePresence = useCallback(async (): Promise<void> => {
    const hasToken = await SecureStorageService.hasValue(SecureStorageKeys.ACCESS_TOKEN);
    if (hasToken.success && hasToken.data) {
      console.log('Access token exists');
    }
  }, []);

  // Очистка всех данных
  const clearAllData = useCallback(async (): Promise<SecureStorageResult> => {
    return await SecureStorageService.clearAll();
  }, []);

  return {
    loadingTokens,
    saveResult,
    savingUserData,
    checkForValuePresence,
    clearAllData,
  };
};
