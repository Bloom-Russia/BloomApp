import { useErrorWithTimeout } from '@hooks';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnBoardingScreen, PinCodeScreen } from '@screens';
import { useAppStore, useUserStore } from '@store';
import { Colors, Spinner } from '@UIKit';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { StatusBar } from 'react-native';
import { AuthorizationStackProps, AuthStackParamList } from './navigationTypes';
import { TabBarNavigator } from './TabNavigator';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const Authentication: React.FC<AuthorizationStackProps> = () => {
  const { fetchCitiesAndProfession } = useAppStore();
  const { fetchUserByPhoneNumber } = useUserStore();
  const [loading, setLoading] = useState<boolean>(false);
  const { setErrorMessageWithTimeout, cleanupErrors } = useErrorWithTimeout();

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupErrors();
    };
  }, [cleanupErrors]);

  const loadAppData = useCallback(async () => {
    const [citiesAndProfession, user] = await Promise.all([
      fetchCitiesAndProfession({
        options: {
          changeLoading: setLoading,
          errorCodeCallBack: setErrorMessageWithTimeout,
        },
      }),
      fetchUserByPhoneNumber({
        options: {
          changeLoading: setLoading,
          errorCodeCallBack: setErrorMessageWithTimeout,
        },
      }),
    ]);
    if (!citiesAndProfession.success || !user.success) {
      console.error('Ошибка загрузки данных пользователя или онбординга.');
    }
  }, [fetchCitiesAndProfession, fetchUserByPhoneNumber, setErrorMessageWithTimeout]);

  useEffect(() => {
    loadAppData().then(noop);
  }, [loadAppData]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor={Colors.transparent}
        barStyle={'light-content'}
        animated={true}
      />
      <Stack.Navigator
        initialRouteName={EScreens.AUTH_PIN_CODE_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.AUTH_PIN_CODE_SCREEN} component={PinCodeScreen} />
        <Stack.Screen name={EScreens.ON_BOARDING_SCREEN} component={OnBoardingScreen} />
        <Stack.Screen name={EScreens.TABS_STACK} component={TabBarNavigator} />
      </Stack.Navigator>
    </>
  );
};

export const AuthenticationStack = memo(Authentication, isEqual);
