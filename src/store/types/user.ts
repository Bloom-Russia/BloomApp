import { UpdateUserRequest } from '@services';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  lastName?: string;
  patronymic?: string;
  birthday?: string;
  telegram?: string;
  experience?: string;
  max?: string;
  city?: string | null;
  professions?: string[];
  address?: string;
  avatar?: string;
  isVerified?: boolean;
  isUserDataComplete?: boolean;
  fullName?: string;
}

export interface UserState {
  user: User;
}

type RequestOptions = {
  errorCodeCallBack?: (message?: string) => void;
  changeLoading?: (value: boolean) => void;
};

export interface UserActions {
  fetchUserByPhoneNumber: ({
    options,
  }: {
    options?: RequestOptions;
  }) => Promise<{ success: boolean }>;
  deleteUser: ({ options }: { options?: RequestOptions }) => Promise<{ success: boolean }>;
  clearUserData: () => Promise<void>;
  updateUser: ({
    options,
    params,
  }: {
    params: {
      userData: UpdateUserRequest;
      messagePhoneNumberIsChanged: () => void;
    };
    options?: RequestOptions;
  }) => Promise<{ success: boolean }>;
}
