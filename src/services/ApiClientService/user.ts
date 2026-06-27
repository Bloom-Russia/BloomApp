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
      const { userData, avatar } = params;
      const avatarUri = extractFileUri(avatar);
      const shouldUploadFile = avatarUri && isLocalFileUri(avatarUri);

      if (shouldUploadFile) {
        const formData = createFormDataFromObject(userData, {
          fieldName: 'avatar',
          fileUri: avatarUri,
          mimeType: extractFileType(avatar),
          fileName: extractFileName(avatar),
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

      const cleanParams = { ...userData };
      delete cleanParams.avatar;

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
