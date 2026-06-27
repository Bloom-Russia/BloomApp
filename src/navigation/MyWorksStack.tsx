import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateWorkScreen, MyWorksScreen } from '@screens';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { MyWorksStackParamList, MyWorksStackProps } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<MyWorksStackParamList>();

const MyWorks: React.FC<MyWorksStackProps> = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName={EScreens.MY_WORKS_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.MY_WORKS_SCREEN} component={MyWorksScreen} />
        <Stack.Screen name={EScreens.CREATE_WORK_SCREEN} component={CreateWorkScreen} />
      </Stack.Navigator>
    </>
  );
};

export const MyWorksStack = memo(MyWorks, isEqual);
