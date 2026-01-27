import { EScreens } from '@navigation';
import { vibrate, VIBRATION_DURATION } from '@utils';
import AxiosService, { ApiResponse } from '../AxiosService';
import NavigationService from '../NavigationService';
import NotificationService from '../NotificationService';
import { SecureStorageKeys, SecureStorageService } from '../SecureStorageService';
import {
  AuthResponseDataRequestVerificationCode,
  AuthResponseDataVerifyCode,
  AuthResponseDataVerifyPinCode,
  AuthTokens,
  RequestCodeParams,
  SavePinParams,
  SavePinResponse,
  VerifyCoderParams,
  VerifyPinCoderParams,
} from './types';

class ApiClientService {
  // Запрос кода подтверждения
  static async requestVerificationCode({
    phone,
  }: RequestCodeParams): Promise<ApiResponse<AuthResponseDataRequestVerificationCode> | undefined> {
    const fcmToken = await NotificationService.getFCMToken();
    try {
      const response = await AxiosService.post<AuthResponseDataRequestVerificationCode>(
        '/api/auth/send-code',
        {
          phoneNumber: `+7${phone}`,
          fcmToken,
        },
      );

      if (response.data.success) {
        NavigationService.navigate(EScreens.SMS_CONFIRM_SCREEN as any, {
          phone: `+7${phone}`,
        });
      }

      return response.data;
    } catch (error: unknown) {
      console.error('Ошибка:', error);
      throw error;
    }
  }

  // Повторный запрос кода подтверждения
  static async resendCode({
    phone,
  }: RequestCodeParams): Promise<ApiResponse<AuthResponseDataRequestVerificationCode> | undefined> {
    const fcmToken = await NotificationService.getFCMToken();
    try {
      const response = await AxiosService.post<AuthResponseDataRequestVerificationCode>(
        '/api/auth/send-code',
        {
          phoneNumber: phone,
          fcmToken,
        },
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Ошибка повторной отправки кода:', error);
      throw error;
    }
  }

  // Верификация кода подтверждения и если isVerified === true, значти авторизовались
  static async verifyCode({
    code,
    phone,
    setIsVerified,
  }: VerifyCoderParams): Promise<ApiResponse<AuthResponseDataVerifyCode> | undefined> {
    try {
      const response = await AxiosService.post<AuthResponseDataVerifyCode>(
        '/api/auth/verify-code',
        {
          phoneNumber: phone,
          code,
        },
      );

      if (response.data.success) {
        // Явно приводим тип через unknown или используем утверждение типа
        const responseData = response.data.data as unknown as AuthTokens;
        const { accessToken, refreshToken, isVerified, phoneNumber } = responseData;

        await SecureStorageService.saveTokens(accessToken, refreshToken);
        await SecureStorageService.saveValue(SecureStorageKeys.PHONE_NUMBER, phoneNumber);
        await setIsVerified(isVerified);
      }

      return response.data;
    } catch (error) {
      console.error('Ошибка верификации кода ', error);
      return undefined;
    }
  }

  // Сохранение PIN кода
  static async savePinCode({
    pinCode,
    phoneNumber,
  }: SavePinParams): Promise<ApiResponse<SavePinResponse> | undefined> {
    try {
      const response = await AxiosService.post<SavePinResponse>('/api/auth/save-pin', {
        phoneNumber,
        pinCode,
      });

      if (response.data.success) {
        vibrate(VIBRATION_DURATION.LONG);
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
        NavigationService.navigate(EScreens.TABS_STACK as any);
      }

      return response.data;
    } catch (error) {
      console.error('Ошибка верификации кода ', error);
      return undefined;
    }
  }
  // Верификация PIN кода
  static async verifyPinCode({
    pinCode,
    phoneNumber,
  }: VerifyPinCoderParams): Promise<ApiResponse<AuthResponseDataVerifyPinCode> | undefined> {
    try {
      const response = await AxiosService.post<AuthResponseDataVerifyPinCode>(
        '/api/auth/verify-pin',
        {
          phoneNumber,
          pinCode,
        },
      );

      if (response.data.success) {
        vibrate(VIBRATION_DURATION.LONG);
        NavigationService.navigate(EScreens.TABS_STACK as any);
      }

      return response.data;
    } catch (error) {
      console.error('Ошибка верификации PIN кода ', error);
      return undefined;
    }
  }
}

export default ApiClientService;
