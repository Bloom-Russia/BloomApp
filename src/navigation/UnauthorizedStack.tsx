import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, PinCodeScreen, SmsConfirmScreen } from '@screens';
import { Colors } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { StatusBar } from 'react-native';
import { UnAuthorizationStackProps, UnAuthStackParamList } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<UnAuthStackParamList>();

const UnAuthentication: React.FC<UnAuthorizationStackProps> = () => {
  return (
    <>
      <StatusBar
        translucent
        backgroundColor={Colors.transparent}
        barStyle={'light-content'}
        animated={true}
      />
      <Stack.Navigator
        initialRouteName={EScreens.LOGIN_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        {/*<Stack.Screen name={EScreens.BOOT_SPLASH_SCREEN} component={BootSplashScreen} />*/}
        <Stack.Screen name={EScreens.LOGIN_SCREEN} component={LoginScreen} />
        <Stack.Screen name={EScreens.SMS_CONFIRM_SCREEN} component={SmsConfirmScreen} />
        <Stack.Screen name={EScreens.AUTH_PIN_CODE_SCREEN} component={PinCodeScreen} />
      </Stack.Navigator>
    </>
  );
};

export const UnauthorizedStack = memo(UnAuthentication, isEqual);
