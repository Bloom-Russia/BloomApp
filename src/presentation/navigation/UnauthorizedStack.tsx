import { Colors } from '@core/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens/auth';

import { observer } from 'mobx-react-lite';
import React, { memo, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import { StatusBar } from 'react-native';
import { EScreens, UnAuthStackParamList } from './types';

const Stack = createNativeStackNavigator<UnAuthStackParamList>();

const UnAuthentication: React.FC = observer(() => {
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor={Colors.transparent}
        barStyle="light-content"
        animated
      />
      <Stack.Navigator
        initialRouteName={EScreens.BOOT_SPLASH_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        {/*<Stack.Screen name={EScreens.BOOT_SPLASH_SCREEN} component={BootSplashScreen} />*/}
        <Stack.Screen name={EScreens.LOGIN_SCREEN} component={LoginScreen} />
        {/*<Stack.Screen name={EScreens.SMS_CONFIRM_SCREEN} component={SmsConfirmScreen} />*/}
        {/*<Stack.Screen name={EScreens.AUTH_PIN_CODE_SCREEN} component={PinCodeScreen} />*/}
      </Stack.Navigator>
    </>
  );
});

export const UnauthorizedStack = memo(UnAuthentication, isEqual);
