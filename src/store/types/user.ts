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
}

export interface UserState {
  user: User;
}

export interface UserActions {
  fetchUserByPhoneNumber: (phoneNumber: string) => Promise<{ success: boolean }>;
  clearUserData: () => void;
  updateUser: (
    userData: UpdateUserRequest,
    messagePhoneNumberIsChanged: () => void,
  ) => Promise<{ success: boolean }>;
}
