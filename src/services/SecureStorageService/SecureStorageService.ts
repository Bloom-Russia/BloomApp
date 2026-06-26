import { SecureStorageKeys } from '@services';
import Keychain, { ACCESSIBLE } from 'react-native-keychain';
import { SecureStorageOptions, SecureStorageResult } from './types';

class SecureStorageService {
  private static instance: SecureStorageService;
  private options: Required<SecureStorageOptions>;

  private defaultOptions: Required<SecureStorageOptions> = {
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: 'com.app.tokens',
  };

  private constructor(options?: Partial<SecureStorageOptions>) {
    this.options = { ...this.defaultOptions, ...options } as Required<SecureStorageOptions>;
  }

  private updateOptions(options: Partial<SecureStorageOptions>): void {
    this.options = { ...this.options, ...options } as Required<SecureStorageOptions>;
  }

  public static getInstance(options?: Partial<SecureStorageOptions>): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService(options);
    } else if (options) {
      SecureStorageService.instance.updateOptions(options);
    }
    return SecureStorageService.instance;
  }

  // ===== PUBLIC METHODS =====

  public async saveValue(
    key: string | SecureStorageKeys,
    value?: string | null | number | boolean,
  ): Promise<SecureStorageResult> {
    return this.instanceSaveValue(key, value);
  }

  public async getValue(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<string | null>> {
    return this.instanceGetValue(key);
  }

  public async removeValue(key: string | SecureStorageKeys): Promise<SecureStorageResult> {
    return this.instanceRemoveValue(key);
  }

  public async clearAll(): Promise<SecureStorageResult> {
    return this.instanceClearAll();
  }

  // ===== TOKEN METHODS =====

  public async saveAccessToken(token?: string | null): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.ACCESS_TOKEN, token);
  }

  public async loadAccessToken(): Promise<SecureStorageResult<string | null>> {
    return this.getValue(SecureStorageKeys.ACCESS_TOKEN);
  }

  public async saveRefreshToken(token?: string | null): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.REFRESH_TOKEN, token);
  }

  public async loadRefreshToken(): Promise<SecureStorageResult<string | null>> {
    return this.getValue(SecureStorageKeys.REFRESH_TOKEN);
  }

  public async saveTokens(
    accessToken?: string | null,
    refreshToken?: string | null,
  ): Promise<SecureStorageResult> {
    return this.instanceSaveTokens(accessToken, refreshToken);
  }

  public async saveIsVerified(isVerified: boolean): Promise<SecureStorageResult> {
    return this.saveValue(SecureStorageKeys.IS_VERIFIED, isVerified.toString());
  }

  public async loadIsVerified(): Promise<SecureStorageResult> {
    const result = await this.getValue(SecureStorageKeys.IS_VERIFIED);
    return {
      success: result.success,
      data: result.data === 'true',
      error: result.error,
    };
  }

  // ===== PRIVATE METHODS =====

  private async instanceSaveValue(
    key: string | SecureStorageKeys,
    value?: string | null | number | boolean,
  ): Promise<SecureStorageResult> {
    try {
      if (value === undefined || value === null) {
        return await this.instanceRemoveValue(key);
      }

      const stringValue = String(value);
      if (stringValue.trim() === '') {
        return await this.instanceRemoveValue(key);
      }

      const username = `token_${key.toString()}`;
      const result = await Keychain.setInternetCredentials(key.toString(), username, stringValue, {
        accessible: this.options.accessible,
        service: this.options.service,
      });

      return { success: result !== false, data: result !== false };
    } catch (error) {
      console.error(`SecureStorage: Ошибка сохранения "${key}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async instanceGetValue(
    key: string | SecureStorageKeys,
  ): Promise<SecureStorageResult<string | null>> {
    try {
      const credentials = await Keychain.getInternetCredentials(key.toString());

      // ✅ Проверяем, что credentials не false и имеет password
      if (credentials && credentials.password) {
        return { success: true, data: credentials.password };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error(`SecureStorage: Ошибка загрузки "${key}":`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async instanceRemoveValue(key: string | SecureStorageKeys): Promise<SecureStorageResult> {
    try {
      await Keychain.resetGenericPassword({ service: key.toString() });
      return { success: true };
    } catch (error) {
      console.error(`SecureStorage: Ошибка удаления "${key}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async instanceClearAll(): Promise<SecureStorageResult> {
    try {
      const keys = Object.values(SecureStorageKeys);
      for (const key of keys) {
        await this.instanceRemoveValue(key);
      }
      await Keychain.resetGenericPassword({ service: this.options.service });
      return { success: true };
    } catch (error) {
      console.error('SecureStorage: Ошибка очистки:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async instanceSaveTokens(
    accessToken?: string | null,
    refreshToken?: string | null,
  ): Promise<SecureStorageResult> {
    try {
      const [accessResult, refreshResult] = await Promise.all([
        this.saveAccessToken(accessToken),
        this.saveRefreshToken(refreshToken),
      ]);

      return {
        success: accessResult.success && refreshResult.success,
        error: accessResult.error || refreshResult.error,
      };
    } catch (error) {
      console.error('SecureStorage: Ошибка сохранения токенов:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

export default SecureStorageService.getInstance();
