import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClientService } from '@services';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { AppActions, AppState } from './types/app';

const initialState: AppState = {
  app: {
    cities: [],
    professions: [],
  },
};

const appStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        fetchCitiesAndProfession: async () => {
          const { data, success } = await ApiClientService.getCitiesAndProfession();
          if (success && data?.cities && data?.professions) {
            set({ app: { cities: data.cities, professions: data.professions } });
            return { success };
          }

          return { success: false };
        },
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          app: state.app,
        }),
      },
    ),
    {
      name: 'app-store',
      enabled: __DEV__,
    },
  ),
);

export const useAppStore = () => {
  return appStore(
    useShallow((state) => ({
      app: state.app,
      fetchCitiesAndProfession: state.fetchCitiesAndProfession,
    })),
  );
};
