import { AppApi } from './app';
import { AuthApi } from './auth';
import { UserApi } from './user';

export const ApiClient = {
  ...AuthApi,
  ...AppApi,
  ...UserApi,
};

export default ApiClient;

export * from './types';
export * from './makeRequest';
