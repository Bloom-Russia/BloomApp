import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClientService } from '@services';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { UserActions, UserState } from './types/user';

const initialState: UserState = {
  user: {
    id: '',
    phoneNumber: '',
    name: '',
    email: '',
    isVerified: undefined,
  },
};

const userStore = create<UserState & UserActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        fetchUserByPhoneNumber: async (phoneNumber: string) =>
          // setAlertMessage?: (message: string | undefined | null) => void,
          // changeLoading?: (value: boolean) => void,
          {
            const { data, success } = await ApiClientService.getUserByPhoneNumber(phoneNumber);
            if (success && data.user) {
              set({ user: data.user });
              return { success };
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
    })),
  );
};
