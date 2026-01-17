import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExampleScreen, PinCodeScreen } from '@screens';
import { Colors } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { StatusBar } from 'react-native';
import { AuthorizationStackProps, AuthStackParamList } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const Authentication: React.FC<AuthorizationStackProps> = () => {
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
        <Stack.Screen name={EScreens.EXAMPLE_SCREEN} component={ExampleScreen} />
      </Stack.Navigator>
    </>
  );
};

export const AuthenticationStack = memo(Authentication, isEqual);
