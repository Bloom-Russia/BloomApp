// user.ts
import { ApiResponse } from '@services';
import { makeRequest, RequestOptions } from './makeRequest';
import {
  UpdateUserRequest,
  UserResponse,
} from './types';

export const UserApi = {
  // Получить пользователя по номеру телефона
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

  // Обновить данные пользователя
  async updateUser({
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
  },
};