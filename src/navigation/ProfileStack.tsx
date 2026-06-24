import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen, ProfileScreen } from '@screens';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { ProfileStackParamList, ProfileStackProps } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const Profile: React.FC<ProfileStackProps> = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName={EScreens.PROFILE_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.PROFILE_SCREEN} component={ProfileScreen} />
        <Stack.Screen name={EScreens.EDIT_PROFILE_SCREEN} component={EditProfileScreen} />
      </Stack.Navigator>
    </>
  );
};

export const ProfileStack = memo(Profile, isEqual);
