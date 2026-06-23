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
        clearUserData: async () => {
          set(initialState);
          await AsyncStorage.removeItem('user-storage');
        },
        fetchUserByPhoneNumber: async (phoneNumber: string) => {
          const { data, success } = await ApiClientService.getUserByPhoneNumber(phoneNumber);
          if (success && data?.user) {
            set({ user: data.user });
            return { success };
          }
          return { success: false };
        },
        updateUser: () => {
          set((state) => ({
            user: { ...state.user },
          }));
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
