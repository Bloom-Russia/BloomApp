// auth.ts
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
  LogoutResponse,
  SavePinParams,
  SavePinResponse,
  VerifyCoderParams,
  VerifyPinCoderParams,
} from './types';

export const AuthApi = {
  async requestVerificationCode({
    phoneNumber,
    options,
  }: {
    phoneNumber: string;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataResponseVerificationCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const fcmToken = await UnifiedNotificationService.getFCMToken();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const result = await makeRequest<AuthResponseDataResponseVerificationCode>(
      {
        type: 'POST',
        url: '/api/auth/send-code',
        params: {
          phoneNumber: normalizedPhone,
          fcmToken,
        },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      NavigationService.navigate(EScreens.SMS_CONFIRM_SCREEN as any, {
        phone: normalizedPhone,
      });
    }

    return result;
  },

  async resendCode({
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
  },

  async verifyCode({
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
  },

  async savePinCode({
    params,
    options,
  }: {
    params: SavePinParams;
    options?: RequestOptions;
  }): Promise<ApiResponse<SavePinResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { pinCode } = params;
    const { success, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!success || !phoneNumber) {
      errorCodeCallBack?.('Номер телефона не найден');
      return { success: false, message: '', data: null };
    }

    const result = await makeRequest<SavePinResponse>(
      {
        type: 'POST',
        url: '/api/auth/save-pin',
        params: { phoneNumber, pinCode },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      vibrate(VIBRATION_DURATION.LONG);
      await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
    }

    return result;
  },

  async verifyPinCode({
    params,
    options,
  }: {
    params: VerifyPinCoderParams;
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthResponseDataVerifyPinCode>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { pinCode } = params;
    const { success, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!success || !phoneNumber) {
      errorCodeCallBack?.('Ошибка верификации PIN');
      return { success: false, message: '', data: null };
    }

    const result = await makeRequest<AuthResponseDataVerifyPinCode>(
      {
        type: 'POST',
        url: '/api/auth/verify-pin',
        params: { phoneNumber, pinCode },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      vibrate(VIBRATION_DURATION.LONG);
    }

    return result;
  },

  async checkPinStatus({
    options,
  }: {
    options?: RequestOptions;
  }): Promise<ApiResponse<CheckPinStatusResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { success: phoneSuccess, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!phoneSuccess || !phoneNumber) {
      await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      return { success: false, data: null };
    }

    const { success, data } = await makeRequest<CheckPinStatusResponse>(
      {
        type: 'GET',
        url: '/api/auth/check-pin',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (success && data) {
      if (data.hasPin) {
        await SecureStorageService.saveValue(SecureStorageKeys.PIN_CODE_IS_SET, true);
      } else {
        await SecureStorageService.removeValue(SecureStorageKeys.PIN_CODE_IS_SET);
      }
    }

    return { success, data };
  },

  async logOutWithToken({
    options,
  }: {
    options?: RequestOptions;
  }): Promise<ApiResponse<LogoutResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { success: phoneNumberSuccess, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!phoneNumberSuccess || !phoneNumber) {
      console.error('Ошибка выхода: номер телефона не найден');
    }

    const result = await makeRequest<LogoutResponse>(
      {
        type: 'POST',
        url: '/api/auth/logout',
        params: { phoneNumber },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (!result.success) {
      return {
        success: true,
        message: 'Выход выполнен (с очисткой локальных данных)',
        data: null,
      };
    }

    return result;
  },

  async loginWithBiometrics({
    options,
  }: {
    options?: RequestOptions;
  }): Promise<ApiResponse<AuthTokens>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { success, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!success || !phoneNumber) {
      errorCodeCallBack?.('Ошибка при биометрической аутентификации');
      return { success: false, message: '', data: null };
    }

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
  },

  async saveBiometricKey({
    params,
    options,
  }: {
    params: { publicKey: string };
    options?: RequestOptions;
  }): Promise<ApiResponse<{ message: string }>> {
    const { errorCodeCallBack, changeLoading } = options || {};
    const { publicKey } = params;
    const { success, data: phoneNumber } = await SecureStorageService.getValue(
      SecureStorageKeys.PHONE_NUMBER,
    );

    if (!success || !phoneNumber) {
      errorCodeCallBack?.('Ошибка сохранения биометрических ключей');
      return { success: false, message: '', data: null };
    }

    const result = await makeRequest<{ message: string }>(
      {
        type: 'POST',
        url: '/api/auth/biometric-key',
        params: { phoneNumber, publicKey },
      },
      { errorCodeCallBack, changeLoading },
    );

    if (result.success) {
      vibrate(VIBRATION_DURATION.SHORT);
    }

    return result;
  },
};
