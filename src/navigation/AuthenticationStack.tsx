import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnBoardingScreen, PinCodeScreen } from '@screens';
import { ApiClientService } from '@services';
import { Colors } from '@UIKit';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import { StatusBar } from 'react-native';
import { AuthorizationStackProps, AuthStackParamList } from './navigationTypes';
import { TabBarNavigator } from './TabNavigator';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const Authentication: React.FC<AuthorizationStackProps> = () => {
  const loadCitiesAndProfession = useCallback(async () => {
    try {
      const response = await ApiClientService.getCitiesAndProfession();

      if (response?.success && response.data?.cities && response.data?.professions) {
        //setOnboardingData(response.data.slides);
      }
    } catch (err) {
      console.error('Ошибка загрузки списока всех городов и профессий:', err);
    }
  }, []);

  // Загрузка списока всех городов и профессий
  useEffect(() => {
    loadCitiesAndProfession().then(noop);
  }, [loadCitiesAndProfession]);

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
