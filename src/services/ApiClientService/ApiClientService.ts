import { EScreens } from '@navigation';
import { ApiResponse } from '@services';
import { normalizePhoneNumber, vibrate, VIBRATION_DURATION } from '@utils';
import NavigationService from '../NavigationService';
import { SecureStorageKeys, SecureStorageService } from '../SecureStorageService';
import UnifiedNotificationService from '../UnifiedNotificationService';
import { makeRequest, RequestOptions } from './makeRequest';
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
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataResponseVerificationCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const fcmToken = await UnifiedNotificationService.getFCMToken();

    const result = await makeRequest<AuthResponseDataResponseVerificationCode>(
      {
        type: 'POST',
        url: '/api/auth/send-code',
        params: {
          phoneNumber: normalizePhoneNumber(phoneNumber),
          fcmToken,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      NavigationService.navigate(EScreens.SMS_CONFIRM_SCREEN as any, {
        phone: normalizePhoneNumber(phoneNumber),
      });
    }

    return result;
  }

  // Повторный запрос кода подтверждения
  static async resendCode({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataResponseVerificationCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const fcmToken = await UnifiedNotificationService.getFCMToken();

    return makeRequest<AuthResponseDataResponseVerificationCode>(
      {
        type: 'POST',
        url: '/api/auth/send-code',
        params: {
          phoneNumber,
          fcmToken,
        },
      },
      { errorCodeCallBack, changeLoading },
    );
  }

  // Верификация кода подтверждения
  static async verifyCode({
    params,
    options,
  }: {
    params: VerifyCoderParams;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataVerifyCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { code, phone, setIsVerified } = params;

    const result = await makeRequest<AuthResponseDataVerifyCode>(
      {
        type: 'POST',
        url: '/api/auth/verify-code',
        params: {
          phoneNumber: phone,
          code,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success && result.data) {
      const tokens = result.data as unknown as AuthTokens;
      const { accessToken, refreshToken, isVerified, phoneNumber } = tokens;

      await SecureStorageService.saveTokens(accessToken, refreshToken);
      await SecureStorageService.saveValue(SecureStorageKeys.PHONE_NUMBER, phoneNumber);
      await setIsVerified(isVerified);
    }

    return result;
  }

  // Сохранение PIN кода
  static async savePinCode({
    params,
    options,
  }: {
    params: SavePinParams;
    options?: RequestOptions;
  }): Promise<ApiResponse<SavePinResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { pinCode, phoneNumber } = params;

    const result = await makeRequest<SavePinResponse>(
      {
        type: 'POST',
        url: '/api/auth/save-pin',
        params: {
          phoneNumber,
          pinCode,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      vibrate(VIBRATION_DURATION.LONG);
      await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
    }

    return result;
  }

  // Верификация PIN кода
  static async verifyPinCode({
    params,
    options,
  }: {
    params: VerifyPinCoderParams;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataVerifyPinCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { pinCode, phoneNumber } = params;

    const result = await makeRequest<AuthResponseDataVerifyPinCode>(
      {
        type: 'POST',
        url: '/api/auth/verify-pin',
        params: {
          phoneNumber,
          pinCode,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      vibrate(VIBRATION_DURATION.LONG);
    }

    return result;
  }

  // Проверка статуса PIN-кода
  static async checkPinStatus({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<CheckPinStatusResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    const result = await makeRequest<CheckPinStatusResponse>(
      {
        type: 'GET',
        url: '/api/auth/check-pin',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success && result.data) {
      const hasPin = result.data.hasPin;
      if (hasPin) {
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
      } else {
        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      }
    }

    return result;
  }

  // Выход пользователя из системы
  static async logOutWithToken({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<LogoutResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    const result = await makeRequest<LogoutResponse>(
      {
        type: 'POST',
        url: '/api/auth/logout',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );

    await SecureStorageService.clearAll();

    // Если запрос не удался, всё равно возвращаем успех
    if (!result.success) {
      return {
        success: true,
        message: 'Выход выполнен (с очисткой локальных данных)',
        data: null,
      };
    }

    return result;
  }

  // Вход через биометрию
  static async loginWithBiometrics({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthTokens>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    const result = await makeRequest<AuthTokens>(
      {
        type: 'POST',
        url: '/api/auth/biometric-login',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success && result.data) {
      const { accessToken, refreshToken, phoneNumber: userPhone } = result.data;
      await SecureStorageService.saveTokens(accessToken, refreshToken);
      await SecureStorageService.saveValue(SecureStorageKeys.PHONE_NUMBER, userPhone);
      vibrate(VIBRATION_DURATION.LONG);
    }

    return result;
  }

  // Сохранение биометрического ключа на сервере
  static async saveBiometricKey({
    params,
    options,
  }: {
    params: {
      phoneNumber: string;
      publicKey: string;
    };
    options?: RequestOptions;
  }): Promise<ApiResponse<{ message: string }>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { phoneNumber, publicKey } = params;

    const result = await makeRequest<{ message: string }>(
      {
        type: 'POST',
        url: '/api/auth/biometric-key',
        params: {
          phoneNumber,
          publicKey,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      console.log('✅ Биометрический ключ успешно сохранен на сервере');
      vibrate(VIBRATION_DURATION.SHORT);
    }

    return result;
  }

  // Получение слайдов для онбординга
  static async getOnboardingSlides(
    options?: RequestOptions,
  ): Promise<ApiResponse<OnboardingResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    const result = await makeRequest<OnboardingResponse>(
      {
        type: 'GET',
        url: '/api/app/onboarding',
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      await SecureStorageService.saveValue(SecureStorageKeys.ONBOARDING_COMPLETED, false);
      console.log('✅ Слайды онбординга успешно получены');
    }

    return result;
  }

  // Получение списка всех городов и профессий
  static async getCitiesAndProfession(
    options?: RequestOptions,
  ): Promise<ApiResponse<CitiesAndProfessionResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    return makeRequest<CitiesAndProfessionResponse>(
      {
        type: 'GET',
        url: '/api/app/cities-professions',
      },
      { errorCodeCallBack, changeLoading },
    );
  }

  // Получить пользователя по номеру телефона
  static async getUserByPhoneNumber({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<UserResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    return makeRequest<UserResponse>(
      {
        type: 'GET',
        url: '/api/users/user',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );
  }

  // Обновить данные пользователя
  static async updateUser({
    params,
    options,
  }: {
    params: UpdateUserRequest;
    options?: RequestOptions;
  }): Promise<ApiResponse<UserResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    return makeRequest<UserResponse>(
      {
        type: 'PUT',
        url: '/api/users/update',
        params,
      },
      { errorCodeCallBack, changeLoading },
    );
  }
}

export default ApiClientService;
