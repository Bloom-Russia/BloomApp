import 'reflect-metadata';
import { IAuthRepository } from '@domain/repositories/IAuthRepository';
import { ISecureStorageRepository } from '@domain/repositories/ISecureStorageRepository';
import { AuthStore } from '@stores/AuthStore';

// Mocks
const mockAuthRepository: jest.Mocked<IAuthRepository> = {
  requestVerificationCode: jest.fn(),
  verifyCode: jest.fn(),
  logout: jest.fn(),
  getAuthStatus: jest.fn(),
  setAuthStatus: jest.fn(),
  getFCMToken: jest.fn(),
  checkNotificationPermission: jest.fn(),
  requestNotificationPermission: jest.fn(),
  getCurrentUser: jest.fn(),
  updateUser: jest.fn(),
};

const mockSecureStorage: jest.Mocked<ISecureStorageRepository> = {
  saveValue: jest.fn(),
  getValue: jest.fn(),
  removeValue: jest.fn(),
  clearAll: jest.fn(),
  saveAccessToken: jest.fn(),
  loadAccessToken: jest.fn(),
  saveRefreshToken: jest.fn(),
  loadRefreshToken: jest.fn(),
  saveTokens: jest.fn(),
  saveIsVerified: jest.fn(),
  loadIsVerified: jest.fn(),
  savePhoneNumber: jest.fn(),
  loadPhoneNumber: jest.fn(),
  savePinCodeStatus: jest.fn(),
  loadPinCodeStatus: jest.fn(),
  saveOnboardingCompleted: jest.fn(),
  loadOnboardingCompleted: jest.fn(),
  saveAllAuthData: jest.fn(),
  loadAllAuthData: jest.fn(),
  clearAllAuthData: jest.fn(),
  saveBiometricEnabled: jest.fn(),
  loadBiometricEnabled: jest.fn(),
  saveBiometricSetupCompleted: jest.fn(),
  loadBiometricSetupCompleted: jest.fn(),
};

describe('AuthStore', () => {
  let authStore: AuthStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Исправлено: передаем только 2 аргумента
    authStore = new AuthStore(mockAuthRepository, mockSecureStorage);
  });

  describe('requestVerificationCode', () => {
    it('should request code successfully', async () => {
      mockAuthRepository.getFCMToken.mockResolvedValue('test-fcm-token');
      mockAuthRepository.requestVerificationCode.mockResolvedValue(undefined);

      const result = await authStore.requestVerificationCode('+79123456789');

      expect(result).toBe(true);
      expect(authStore.phoneNumber).toBe('+79123456789');
      expect(authStore.isCodeSent).toBe(true);
      expect(authStore.isLoading).toBe(false);
      expect(authStore.error).toBeNull();
    });

    it('should handle FCM token error', async () => {
      mockAuthRepository.getFCMToken.mockResolvedValue(null);

      const result = await authStore.requestVerificationCode('+79123456789');

      expect(result).toBe(false);
      expect(authStore.isCodeSent).toBe(false);
      expect(authStore.error).toBe('auth.errors.FCM_TOKEN_NOT_RECEIVED');
    });

    it('should handle API error', async () => {
      mockAuthRepository.getFCMToken.mockResolvedValue('test-fcm-token');
      mockAuthRepository.requestVerificationCode.mockRejectedValue(new Error('Network error'));

      const result = await authStore.requestVerificationCode('+79123456789');

      expect(result).toBe(false);
      expect(authStore.error).toBe('Network error');
    });
  });
});
