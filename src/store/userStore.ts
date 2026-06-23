import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { UserActions, UserState } from './types/user';

const initialState: UserState = {
  user: {
    id: '',
    phoneNumber: '',
    name: '',
    lastName: '',
    patronymic: '',
    birthday: '',
    email: '',
    experience: '',
    city: null,
    professions: [],
    address: '',
    telegram: '',
    max: '',
    avatar: '',
    isUserDataComplete: false,
    isVerified: false,
  },
};

const userStore = create<UserState & UserActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        clearUserData: async () => {
          set(initialState);
          await AsyncStorage.removeItem('user-storage');
        },
        fetchUserByPhoneNumber: async (phoneNumber: string) => {
          const { data, success } = await ApiClientService.getUserByPhoneNumber(phoneNumber);
          if (success && data?.user) {
            set({ user: { ...data.user, isUserDataComplete: data?.isUserDataComplete } });
            return { success };
          }
          return { success: false };
        },
        updateUser: async (userData, messagePhoneNumberIsChanged) => {
          const { data, success } = await ApiClientService.updateUser(userData);
          if (success && data?.user) {
            const phone = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
            if (phone.success && phone.data) {
              if (phone.data !== data.user.phoneNumber) {
                messagePhoneNumberIsChanged();
                await SecureStorageService.saveValue(
                  SecureStorageKeys.PHONE_NUMBER,
                  data.user.phoneNumber,
                );
              }
            }
            set({ user: data.user });
            return { success: true };
          }
          return { success: false };
        },
      }),
      {
        name: 'user-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          user: state.user,
        }),
      },
    ),
    {
      name: 'user-store',
      enabled: __DEV__,
    },
  ),
);

export const useUserStore = () => {
  return userStore(
    useShallow((state) => ({
      user: state.user,
      fetchUserByPhoneNumber: state.fetchUserByPhoneNumber,
      clearUserData: state.clearUserData,
      updateUser: state.updateUser,
    })),
  );
};
