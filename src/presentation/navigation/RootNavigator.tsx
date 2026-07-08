import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { EScreens, RootStackParamList } from './types';
import { UnauthorizedStack } from './UnauthorizedStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = observer(() => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={EScreens.UN_AUTHORIZATION_STACK} component={UnauthorizedStack} />
    </Stack.Navigator>
  );
});
