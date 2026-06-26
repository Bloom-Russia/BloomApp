// user.ts

import { ApiResponse } from '@services';
import {
  createFormDataFromObject,
  extractFileName,
  extractFileType,
  extractFileUri,
  isLocalFileUri,
} from '@utils';
import { isFormData, isUpdateUserData } from './guards';
import { makeRequest, RequestOptions } from './makeRequest';
import { UpdateUserRequest, UserResponse } from './types';

export const UserApi = {
  async getUserByPhoneNumber({
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
  },

  async updateUser({
    params,
    options,
  }: {
    params: UpdateUserRequest;
    options?: RequestOptions;
  }): Promise<ApiResponse<UserResponse>> {
    const { errorCodeCallBack, changeLoading } = options || {};

    if (isFormData(params)) {
      return makeRequest<UserResponse>(
        {
          type: 'UPLOAD',
          url: '/api/users/update',
          formData: params,
        },
        { errorCodeCallBack, changeLoading },
      );
    }

    if (isUpdateUserData(params)) {
      const avatarUri = extractFileUri(params.avatar);

      // Проверяем, является ли avatar локальным файлом
      if (avatarUri && isLocalFileUri(avatarUri)) {
        const paramsWithAvatarString = { ...params };
        paramsWithAvatarString.avatar = avatarUri;

        const formData = createFormDataFromObject(paramsWithAvatarString, {
          fieldName: 'avatar',
          fileUri: avatarUri,
          mimeType: extractFileType(params.avatar),
          fileName: extractFileName(params.avatar),
        });

        return makeRequest<UserResponse>(
          {
            type: 'UPLOAD',
            url: '/api/users/update',
            formData,
          },
          { errorCodeCallBack, changeLoading },
        );
      }

      // Очищаем params от avatar, если это URL с сервера или невалидное значение
      const cleanParams = { ...params };

      // Проверяем avatar: если это URL с сервера или строка, содержащая путь к аватару
      if (cleanParams.avatar !== undefined && cleanParams.avatar !== null) {
        const avatarValue = cleanParams.avatar;

        // Проверяем, является ли avatar URL с сервера
        const isServerUrl =
          typeof avatarValue === 'string' &&
          (avatarValue.includes('/uploads/avatars/') ||
            avatarValue.startsWith('http://') ||
            avatarValue.startsWith('https://'));

        // Если это URL с сервера, удаляем его из параметров
        if (isServerUrl) {
          delete cleanParams.avatar;
        }
      }

      return makeRequest<UserResponse>(
        {
          type: 'PUT',
          url: '/api/users/update',
          params: cleanParams,
        },
        { errorCodeCallBack, changeLoading },
      );
    }

    throw new Error('Неверный тип данных для updateUser');
  },

  async deleteUser({ options }: { options?: RequestOptions }): Promise<ApiResponse> {
    const { errorCodeCallBack, changeLoading } = options || {};

    return makeRequest<UserResponse>(
      {
        type: 'DELETE',
        url: '/api/users/delete',
      },
      { errorCodeCallBack, changeLoading },
    );
  },
};
