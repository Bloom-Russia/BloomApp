import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { HomeStackParamList, HomeStackProps } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const Home: React.FC<HomeStackProps> = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName={EScreens.HOME_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.HOME_SCREEN} component={HomeScreen} />
      </Stack.Navigator>
    </>
  );
};

export const HomeStack = memo(Home, isEqual);
