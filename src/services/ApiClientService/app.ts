// app.ts
import { ApiResponse } from '@services';
import { SecureStorageKeys, SecureStorageService } from '../SecureStorageService';
import { makeRequest, RequestOptions } from './makeRequest';
import {
  CitiesAndProfessionResponse,
  OnboardingResponse,
} from './types';

export const AppApi = {
  // Получение слайдов для онбординга
  async getOnboardingSlides(
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
  },

  // Получение списка всех городов и профессий
  async getCitiesAndProfession(
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
  },
};