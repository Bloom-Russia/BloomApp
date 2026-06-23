import { EScreens } from '@navigation';
import { vibrate, VIBRATION_DURATION } from '@utils';
import { isAxiosError } from 'axios';
import AxiosService, { ApiResponse } from '../AxiosService';
import NavigationService from '../NavigationService';
import { SecureStorageKeys, SecureStorageService } from '../SecureStorageService';
import UnifiedNotificationService from '../UnifiedNotificationService';
import {
  AuthResponseDataResponseVerificationCode,
  AuthResponseDataVerifyCode,
  AuthResponseDataVerifyPinCode,
  AuthTokens,
  CheckPinStatusResponse,
  CitiesAndProfessionResponse,
  LogoutResponse,
  OnboardingResponse,
  SavePinParams,
  SavePinResponse,
  UpdateUserRequest,
  UserResponse,
  VerifyCoderParams,
  VerifyPinCoderParams,
} from './types';

class ApiClientService {
  // Запрос кода подтверждения
  static async requestVerificationCode({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<ApiResponse<AuthResponseDataResponseVerificationCode>> {
    const fcmToken = await UnifiedNotificationService.getFCMToken();
    const response = await AxiosService.post<AuthResponseDataResponseVerificationCode>(
      '/api/auth/send-code',
      {
        phoneNumber: `+7${phoneNumber}`,
        fcmToken,
      },
    );

    if (response.data.success) {
      NavigationService.navigate(EScreens.SMS_CONFIRM_SCREEN as any, {
        phone: `+7${phoneNumber}`,
      });
    }

    return response.data;
  }

  // Повторный запрос кода подтверждения
  static async resendCode({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<ApiResponse<AuthResponseDataResponseVerificationCode>> {
    const fcmToken = await UnifiedNotificationService.getFCMToken();
    const response = await AxiosService.post<AuthResponseDataResponseVerificationCode>(
      '/api/auth/send-code',
      {
        phoneNumber,
        fcmToken,
      },
    );
    return response.data;
  }

  // Верификация кода подтверждения
  static async verifyCode({
    code,
    phone,
    setIsVerified,
    errorCodeCallBack,
  }: VerifyCoderParams): Promise<ApiResponse<AuthResponseDataVerifyCode>> {
    try {
      const response = await AxiosService.post<AuthResponseDataVerifyCode>(
        '/api/auth/verify-code',
        {
          phoneNumber: phone,
          code,
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Ошибка верификации кода');
      }

      const responseData = response.data.data as unknown as AuthTokens;
      const { accessToken, refreshToken, isVerified, phoneNumber } = responseData;

      await SecureStorageService.saveTokens(accessToken, refreshToken);
      await SecureStorageService.saveValue(SecureStorageKeys.PHONE_NUMBER, phoneNumber);
      await setIsVerified(isVerified);

      return response.data;
    } catch (error) {
      // Проверяем, является ли ошибка ошибкой axios
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as Record<string, unknown>;
        const errorMessage =
          typeof errorData.message === 'string'
            ? errorData.message
            : 'Произошла ошибка при выполнении запроса';
        errorCodeCallBack?.(errorMessage);
      } else if (error instanceof Error) {
        errorCodeCallBack?.(error.message);
      }

      return {
        success: false,
        data: null,
      };
    }
  }

  // Сохранение PIN кода
  static async savePinCode({
    pinCode,
    phoneNumber,
  }: SavePinParams): Promise<ApiResponse<SavePinResponse>> {
    const response = await AxiosService.post<SavePinResponse>('/api/auth/save-pin', {
      phoneNumber,
      pinCode,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка сохранения PIN-кода');
    }

    vibrate(VIBRATION_DURATION.LONG);
    await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);

    return response.data;
  }

  // Верификация PIN кода
  static async verifyPinCode({
    pinCode,
    phoneNumber,
  }: VerifyPinCoderParams): Promise<ApiResponse<AuthResponseDataVerifyPinCode>> {
    const response = await AxiosService.post<AuthResponseDataVerifyPinCode>(
      '/api/auth/verify-pin',
      {
        phoneNumber,
        pinCode,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Неверный PIN-код');
    }

    vibrate(VIBRATION_DURATION.LONG);
    return response.data;
  }

  // Проверка статуса PIN-кода
  static async checkPinStatus({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<ApiResponse<CheckPinStatusResponse>> {
    const response = await AxiosService.get<CheckPinStatusResponse>('/api/auth/check-pin', {
      params: { phoneNumber },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка проверки PIN-кода');
    }

    if (response.data.data) {
      const hasPin = response.data.data.hasPin;
      if (hasPin) {
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
      } else {
        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      }
    }

    return response.data;
  }

  // Выход пользователя из системы
  static async logOutWithToken({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<ApiResponse<LogoutResponse>> {
    try {
      const response = await AxiosService.post<LogoutResponse>('/api/auth/logout', {
        phoneNumber,
      });

      await SecureStorageService.clearAll();

      if (response.data.success) {
        return response.data;
      }

      return {
        success: true,
        message: 'Выход выполнен успешно',
        data: null,
      };
    } catch (error) {
      await SecureStorageService.clearAll();

      console.error('Logout error:', error);

      return {
        success: true,
        message: 'Выход выполнен (с очисткой локальных данных)',
        data: null,
      };
    }
  }

  // Вход через биометрию
  static async loginWithBiometrics({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<ApiResponse<AuthTokens>> {
    const response = await AxiosService.post<AuthTokens>('/api/auth/biometric-login', {
      phoneNumber,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Ошибка биометрического входа');
    }

    const { accessToken, refreshToken, phoneNumber: userPhone } = response.data.data;

    await SecureStorageService.saveTokens(accessToken, refreshToken);
    await SecureStorageService.saveValue(SecureStorageKeys.PHONE_NUMBER, userPhone);

    vibrate(VIBRATION_DURATION.LONG);

    return response.data;
  }

  // Сохранение биометрического ключа на сервере
  static async saveBiometricKey({
    phoneNumber,
    publicKey,
  }: {
    phoneNumber: string;
    publicKey: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const response = await AxiosService.post<{ message: string }>('/api/auth/biometric-key', {
      phoneNumber,
      publicKey,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка сохранения биометрического ключа');
    }

    console.log('✅ Биометрический ключ успешно сохранен на сервере');
    vibrate(VIBRATION_DURATION.SHORT);

    return response.data;
  }

  // Получение слайдов для онбординга
  static async getOnboardingSlides(): Promise<ApiResponse<OnboardingResponse>> {
    const response = await AxiosService.get<OnboardingResponse>('/api/app/onboarding');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Ошибка получения слайдов онбординга');
    }

    await SecureStorageService.saveValue(SecureStorageKeys.ONBOARDING_COMPLETED, false);
    console.log('✅ Слайды онбординга успешно получены');

    return response.data;
  }

  // Получение списока всех городов и профессий
  static async getCitiesAndProfession(): Promise<ApiResponse<CitiesAndProfessionResponse>> {
    const response = await AxiosService.get<CitiesAndProfessionResponse>(
      '/api/app/cities-professions',
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Ошибка получения списка городов и профессий');
    }

    return response.data;
  }

  // Получить пользователя по номеру телефона
  static async getUserByPhoneNumber(phoneNumber: string): Promise<ApiResponse<UserResponse>> {
    const response = await AxiosService.get<UserResponse>(`/api/users/user`, {
      params: { phoneNumber },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Ошибка получения пользователя');
    }

    console.log(`✅ Пользователь с номером ${phoneNumber} успешно получен`);

    return response.data;
  }

  // Обновить данные пользователя
  static async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await AxiosService.put<UserResponse>(`/api/users/update`, userData);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Ошибка обновления пользователя');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления пользователя:', error);
      throw error;
    }
  }
}

export default ApiClientService;
