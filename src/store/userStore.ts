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
    fullName: '',
    avatarUrl: '',
  },
};

const userStore = create<UserState & UserActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        clearUserData: async () => {
          await AsyncStorage.removeItem('user-storage');
          set(initialState);
        },
        fetchUserByPhoneNumber: async ({ options }) => {
          const { errorCodeCallBack, changeLoading } = options || {};
          const { success: phoneSuccess, data: phoneData } = await SecureStorageService.getValue(
            SecureStorageKeys.PHONE_NUMBER,
          );
          if (!phoneSuccess || !phoneData) {
            return { success: false };
          }
          const { data, success } = await ApiClientService.getUserByPhoneNumber({
            phoneNumber: phoneData,
            options: {
              errorCodeCallBack,
              changeLoading,
            },
          });
          if (success && data?.user) {
            set({ user: { ...data.user, isUserDataComplete: data?.isUserDataComplete } });
            return { success: true };
          }
          return { success: false };
        },
        deleteUser: async ({ options }) => {
          const { errorCodeCallBack, changeLoading } = options || {};
          const { success } = await ApiClientService.deleteUser({
            options: {
              errorCodeCallBack,
              changeLoading,
            },
          });

          if (success) {
            return { success: true };
          }

          console.error('❌ Ошибка удаления пользователя:');
          return { success: false };
        },
        updateUser: async ({ params, options }) => {
          const { userData, messagePhoneNumberIsChanged } = params;
          const { errorCodeCallBack, changeLoading } = options || {};

          const { data, success } = await ApiClientService.updateUser({
            params: userData,
            options: {
              errorCodeCallBack,
              changeLoading,
            },
          });
          if (!success || !data?.user) {
            console.error('❌ Ошибка обновления пользователя:');
            return { success: false };
          }

          if (data.phoneIsChanged) {
            await SecureStorageService.saveValue(
              SecureStorageKeys.PHONE_NUMBER,
              data.user.phoneNumber,
            );
            messagePhoneNumberIsChanged?.();
            return { success: true };
          }

          set((state) => ({
            user: { ...state.user, ...data.user },
          }));
          return { success: true };
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
      deleteUser: state.deleteUser,
    })),
  );
};
