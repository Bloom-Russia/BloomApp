export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  isVerified?: boolean;
  isUserDataComplete?: boolean;
}

export interface UserState {
  user: User;
}

export interface UserActions {
  fetchUserByPhoneNumber: (
    phoneNumber: string,
    setAlertMessage?: (message: string | undefined | null) => void,
    changeLoading?: (value: boolean) => void,
  ) => Promise<{ success: boolean }>;
  clearUserData: () => void;
  updateUser: () => { success: boolean };
}
