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
            return { success };
          }
          return { success: false };
        },
        updateUser: async ({ params, options }) => {
          const { userData, messagePhoneNumberIsChanged } = params;
          const { errorCodeCallBack, changeLoading } = options || {};

          try {
            const { data, success } = await ApiClientService.updateUser({
              params: userData,
              options: {
                errorCodeCallBack,
                changeLoading,
              },
            });
            if (!success || !data?.user) {
              return { success: false };
            }

            if (data.phoneIsChanged) {
              await SecureStorageService.saveValue(
                SecureStorageKeys.PHONE_NUMBER,
                data.user.phoneNumber,
              );
              messagePhoneNumberIsChanged();
              return { success: true };
            }

            set({ user: data.user });
            return { success: true };
          } catch {
            console.error('❌ Ошибка обновления пользователя:');
            return { success: false };
          }
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
