import { User } from '../entities';

export interface IAuthRepository {
  // ===== Аутентификация =====
  requestVerificationCode(params: { phoneNumber: string; fcmToken: string }): Promise<void>;
  verifyCode(params: { phoneNumber: string; code: string }): Promise<{ token: string }>;
  logout(): Promise<void>;

  // ===== Статус =====
  getAuthStatus(): Promise<{ isVerified: boolean }>;
  setAuthStatus(isVerified: boolean): Promise<void>;

  // ===== FCM =====
  getFCMToken(): Promise<string | null>;
  checkNotificationPermission(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;

  // ===== Пользователь =====
  getCurrentUser(): Promise<User | null>;
  updateUser(user: Partial<User>): Promise<User>;
}
