import { User } from '@domain/entities/User';
import { IAuthRepository, ISecureStorageRepository } from '@domain/repositories';
import messaging from '@react-native-firebase/messaging';
import { NotificationPermissionService } from '@services';
import { ApiClient } from '../datasources/remote/api/client';
import { TokenManager } from '../datasources/remote/api/tokenManager';

interface VerifyCodeResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export class AuthRepositoryImpl implements IAuthRepository {
  private tokenManager: TokenManager;

  constructor(private secureStorage: ISecureStorageRepository) {
    this.tokenManager = TokenManager.getInstance();
  }

  async requestVerificationCode(params: { phoneNumber: string; fcmToken: string }): Promise<void> {
    await ApiClient.post('/auth/request-code', {
      phone: params.phoneNumber,
      fcmToken: params.fcmToken,
    });
  }

  async verifyCode(params: {
    phoneNumber: string;
    code: string;
  }): Promise<{ token: string; user: User }> {
    // ✅ Используем типизированный ответ
    const response = await ApiClient.post<VerifyCodeResponse>('/auth/verify-code', params);

    const data = response.data.data;

    if (!data) {
      throw new Error('Invalid response from server');
    }

    // ✅ Теперь refreshToken типизирован
    const { token, user, refreshToken = '' } = data;

    await this.secureStorage.saveAllAuthData({
      accessToken: token,
      refreshToken: refreshToken,
      phoneNumber: params.phoneNumber,
      isVerified: true,
    });

    ApiClient.setAuthHeader(token);

    return { token, user };
  }

  async logout(): Promise<void> {
    const phoneNumber = await this.secureStorage.loadPhoneNumber();
    if (phoneNumber) {
      try {
        await ApiClient.post('/auth/logout', { phoneNumber });
      } catch {
        // Игнорируем ошибки при logout
      }
    }

    await this.secureStorage.clearAllAuthData();
    await this.tokenManager.clearTokens();
    ApiClient.reset();
  }

  async getAuthStatus(): Promise<{ isVerified: boolean }> {
    const isVerified = await this.secureStorage.loadIsVerified();
    return { isVerified };
  }

  async setAuthStatus(isVerified: boolean): Promise<void> {
    await this.secureStorage.saveIsVerified(isVerified);
  }

  async getFCMToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async checkNotificationPermission(): Promise<boolean> {
    return NotificationPermissionService.checkPermission();
  }

  async requestNotificationPermission(): Promise<boolean> {
    return NotificationPermissionService.requestPermission();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await ApiClient.get<User>('/user/profile');
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUser(user: Partial<User>): Promise<User> {
    const response = await ApiClient.put<User>('/user/profile', user);
    return response.data.data;
  }
}
