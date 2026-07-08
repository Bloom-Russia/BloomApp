import { Colors } from '@core/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens';

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
        initialRouteName={EScreens.LOGIN_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.LOGIN_SCREEN} component={LoginScreen} />
      </Stack.Navigator>
    </>
  );
});

export const UnauthorizedStack = memo(UnAuthentication, isEqual);
