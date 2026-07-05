export interface ISecureStorageRepository {
  // Базовые операции
  saveValue(key: string, value: string | null | number | boolean): Promise<boolean>;
  getValue<T = string>(key: string): Promise<T | null>;
  removeValue(key: string): Promise<boolean>;
  clearAll(): Promise<boolean>;

  // Токены
  saveAccessToken(token: string): Promise<boolean>;
  loadAccessToken(): Promise<string | null>;
  saveRefreshToken(token: string): Promise<boolean>;
  loadRefreshToken(): Promise<string | null>;
  saveTokens(accessToken: string, refreshToken: string): Promise<boolean>;

  // Статус
  saveIsVerified(value: boolean): Promise<boolean>;
  loadIsVerified(): Promise<boolean>;

  // Пользователь
  savePhoneNumber(phone: string): Promise<boolean>;
  loadPhoneNumber(): Promise<string | null>;

  // PIN-код
  savePinCodeStatus(isSet: boolean): Promise<boolean>;
  loadPinCodeStatus(): Promise<boolean>;

  // Онбординг
  saveOnboardingCompleted(completed: boolean): Promise<boolean>;
  loadOnboardingCompleted(): Promise<boolean>;

  // Биометрия
  saveBiometricEnabled(enabled: boolean): Promise<boolean>;
  loadBiometricEnabled(): Promise<boolean>;
  saveBiometricSetupCompleted(completed: boolean): Promise<boolean>;
  loadBiometricSetupCompleted(): Promise<boolean>;

  // Batch операции
  saveAllAuthData(params: {
    accessToken: string;
    refreshToken: string;
    phoneNumber?: string;
    isVerified?: boolean;
  }): Promise<boolean>;

  loadAllAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    phoneNumber: string | null;
    isVerified: boolean;
  }>;

  clearAllAuthData(): Promise<boolean>;
}
