import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';

export const useModalScreenOptions = () => {
  return useMemo<NativeStackNavigationOptions>(
    () => ({
      contentStyle: {
        backgroundColor: 'rgba(0,0,0, 0.3)',
      },
      headerShown: false,
      presentation: 'transparentModal',
      animation: 'fade',
    }),
    [],
  );
};
