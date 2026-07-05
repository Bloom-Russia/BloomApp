import { ISecureStorageRepository } from '@domain';
import Keychain, { ACCESSIBLE } from 'react-native-keychain';

/**
 * Ключи для безопасного хранилища
 */
export enum SecureStorageKeys {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  PHONE_NUMBER = 'phone_number',
  IS_VERIFIED = 'isVerified',
  PIN_CODE_IS_SET = 'pin_code_is_set',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  BIOMETRIC_ENABLED = 'biometric_enabled',
  BIOMETRIC_SETUP_COMPLETED = 'biometric_setup_completed',
}

/**
 * Реализация репозитория для безопасного хранения данных
 * Использует react-native-keychain для шифрованного хранения на устройстве
 *
 * ⚠️ Важно: Keychain хранит пары (username, password) для каждого service.
 * Мы используем key как username, а value как password.
 * Все ключи хранятся в одном service = 'com.bloom.app.tokens'.
 */
export class SecureStorageRepositoryImpl implements ISecureStorageRepository {
  private readonly options = {
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: 'com.bloom.app.tokens',
  };

  /**
   * Сохранение значения по ключу
   */
  async saveValue(key: string, value: string | null | number | boolean): Promise<boolean> {
    try {
      if (value === undefined || value === null || String(value).trim() === '') {
        return await this.removeValue(key);
      }

      const stringValue = String(value);

      // ✅ Используем setGenericPassword с username = key
      const result = await Keychain.setGenericPassword(key, stringValue, {
        accessible: this.options.accessible,
        service: this.options.service,
      });

      return result !== false;
    } catch (error) {
      console.error(`[SecureStorage] Ошибка сохранения "${key}":`, error);
      return false;
    }
  }

  /**
   * Получение значения по ключу
   */
  async getValue<T = string>(key: string): Promise<T | null> {
    try {
      // ✅ Получаем все credentials для сервиса
      const credentials = await Keychain.getGenericPassword({
        service: this.options.service,
      });

      // ✅ Проверяем, что username совпадает с искомым ключом
      if (credentials && credentials.username === key) {
        return credentials.password as T;
      }
      return null;
    } catch (error) {
      console.error(`[SecureStorage] Ошибка загрузки "${key}":`, error);
      return null;
    }
  }

  /**
   * Удаление значения по ключу
   * ⚠️ Keychain не поддерживает удаление конкретной записи по username.
   * Поэтому мы перезаписываем все данные, исключая удаляемый ключ.
   */
  async removeValue(key: string): Promise<boolean> {
    try {
      // 🔄 Получаем все текущие данные
      const allData = await this.loadAllAuthData();

      // 🔄 Сохраняем все данные, КРОМЕ удаляемого ключа
      const savePromises: Promise<boolean>[] = [];

      // Сохраняем токены, если они есть и не являются удаляемым ключом
      if (key !== SecureStorageKeys.ACCESS_TOKEN && allData.accessToken) {
        savePromises.push(this.saveAccessToken(allData.accessToken));
      }
      if (key !== SecureStorageKeys.REFRESH_TOKEN && allData.refreshToken) {
        savePromises.push(this.saveRefreshToken(allData.refreshToken));
      }
      if (key !== SecureStorageKeys.PHONE_NUMBER && allData.phoneNumber) {
        savePromises.push(this.savePhoneNumber(allData.phoneNumber));
      }
      if (key !== SecureStorageKeys.IS_VERIFIED) {
        savePromises.push(this.saveIsVerified(allData.isVerified));
      }

      // Если есть другие ключи, сохраняем их
      if (key !== SecureStorageKeys.PIN_CODE_IS_SET) {
        const pinStatus = await this.loadPinCodeStatus();
        if (pinStatus) {
          savePromises.push(this.savePinCodeStatus(pinStatus));
        }
      }
      if (key !== SecureStorageKeys.ONBOARDING_COMPLETED) {
        const onboardingStatus = await this.loadOnboardingCompleted();
        if (onboardingStatus) {
          savePromises.push(this.saveOnboardingCompleted(onboardingStatus));
        }
      }
      if (key !== SecureStorageKeys.BIOMETRIC_ENABLED) {
        const biometricEnabled = await this.loadBiometricEnabled();
        if (biometricEnabled) {
          savePromises.push(this.saveBiometricEnabled(biometricEnabled));
        }
      }
      if (key !== SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED) {
        const biometricSetup = await this.loadBiometricSetupCompleted();
        if (biometricSetup) {
          savePromises.push(this.saveBiometricSetupCompleted(biometricSetup));
        }
      }

      // ✅ Очищаем сервис
      await Keychain.resetGenericPassword({
        service: this.options.service,
      });

      // ✅ Сохраняем все данные, кроме удаленного ключа
      await Promise.all(savePromises);

      return true;
    } catch (error) {
      console.error(`[SecureStorage] Ошибка удаления "${key}":`, error);
      return false;
    }
  }

  /**
   * Очистка всех данных
   */
  async clearAll(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({
        service: this.options.service,
      });
      return true;
    } catch (error) {
      console.error('[SecureStorage] Ошибка очистки:', error);
      return false;
    }
  }

  async saveAccessToken(token: string): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.ACCESS_TOKEN, token);
  }

  async loadAccessToken(): Promise<string | null> {
    return this.getValue<string>(SecureStorageKeys.ACCESS_TOKEN);
  }

  async saveRefreshToken(token: string): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.REFRESH_TOKEN, token);
  }

  async loadRefreshToken(): Promise<string | null> {
    return this.getValue<string>(SecureStorageKeys.REFRESH_TOKEN);
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      const [accessResult, refreshResult] = await Promise.all([
        this.saveAccessToken(accessToken),
        this.saveRefreshToken(refreshToken),
      ]);
      return accessResult && refreshResult;
    } catch (error) {
      console.error('[SecureStorage] Ошибка сохранения токенов:', error);
      return false;
    }
  }

  async saveIsVerified(value: boolean): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.IS_VERIFIED, value.toString());
  }

  async loadIsVerified(): Promise<boolean> {
    const result = await this.getValue<string>(SecureStorageKeys.IS_VERIFIED);
    return result === 'true';
  }

  async savePhoneNumber(phone: string): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.PHONE_NUMBER, phone);
  }

  async loadPhoneNumber(): Promise<string | null> {
    return this.getValue<string>(SecureStorageKeys.PHONE_NUMBER);
  }

  async savePinCodeStatus(isSet: boolean): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, isSet.toString());
  }

  async loadPinCodeStatus(): Promise<boolean> {
    const result = await this.getValue<string>(SecureStorageKeys.PIN_CODE_IS_SET);
    return result === 'true';
  }

  async saveOnboardingCompleted(completed: boolean): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.ONBOARDING_COMPLETED, completed.toString());
  }

  async loadOnboardingCompleted(): Promise<boolean> {
    const result = await this.getValue<string>(SecureStorageKeys.ONBOARDING_COMPLETED);
    return result === 'true';
  }

  async saveBiometricEnabled(enabled: boolean): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.BIOMETRIC_ENABLED, enabled.toString());
  }

  async loadBiometricEnabled(): Promise<boolean> {
    const result = await this.getValue<string>(SecureStorageKeys.BIOMETRIC_ENABLED);
    return result === 'true';
  }

  async saveBiometricSetupCompleted(completed: boolean): Promise<boolean> {
    return this.saveValue(SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED, completed.toString());
  }

  async loadBiometricSetupCompleted(): Promise<boolean> {
    const result = await this.getValue<string>(SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED);
    return result === 'true';
  }

  async saveAllAuthData(params: {
    accessToken: string;
    refreshToken: string;
    phoneNumber?: string;
    isVerified?: boolean;
  }): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.saveAccessToken(params.accessToken),
        this.saveRefreshToken(params.refreshToken),
        params.phoneNumber ? this.savePhoneNumber(params.phoneNumber) : Promise.resolve(true),
        params.isVerified !== undefined
          ? this.saveIsVerified(params.isVerified)
          : Promise.resolve(true),
      ]);
      return results.every((result) => result === true);
    } catch (error) {
      console.error('[SecureStorage] Ошибка сохранения данных аутентификации:', error);
      return false;
    }
  }

  async loadAllAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    phoneNumber: string | null;
    isVerified: boolean;
  }> {
    const [accessToken, refreshToken, phoneNumber, isVerified] = await Promise.all([
      this.loadAccessToken(),
      this.loadRefreshToken(),
      this.loadPhoneNumber(),
      this.loadIsVerified(),
    ]);

    return { accessToken, refreshToken, phoneNumber, isVerified };
  }

  async clearAllAuthData(): Promise<boolean> {
    try {
      // ✅ Очищаем только данные аутентификации
      const keys = [
        SecureStorageKeys.ACCESS_TOKEN,
        SecureStorageKeys.REFRESH_TOKEN,
        SecureStorageKeys.PHONE_NUMBER,
        SecureStorageKeys.IS_VERIFIED,
      ];

      // Удаляем каждый ключ
      for (const key of keys) {
        await this.removeValue(key);
      }
      return true;
    } catch (error) {
      console.error('[SecureStorage] Ошибка очистки данных аутентификации:', error);
      return false;
    }
  }
}

export default SecureStorageRepositoryImpl;
