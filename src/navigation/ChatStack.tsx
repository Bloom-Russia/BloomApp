import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '@screens';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { ChatStackParamList, ChatStackProps } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

const Chat: React.FC<ChatStackProps> = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName={EScreens.CHAT_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.CHAT_SCREEN} component={ChatScreen} />
      </Stack.Navigator>
    </>
  );
};

export const ChatStack = memo(Chat, isEqual);
