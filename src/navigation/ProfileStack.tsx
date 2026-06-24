import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen, ProfileScreen } from '@screens';
import { useUserStore } from '@store';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { ProfileStackParamList, ProfileStackProps } from './navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const Profile: React.FC<ProfileStackProps> = () => {
  const {
    user: { isUserDataComplete },
  } = useUserStore();
  return (
    <>
      <Stack.Navigator
        initialRouteName={
          isUserDataComplete ? EScreens.PROFILE_SCREEN : EScreens.EDIT_PROFILE_SCREEN
        }
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.PROFILE_SCREEN} component={ProfileScreen} />
        <Stack.Screen name={EScreens.EDIT_PROFILE_SCREEN} component={EditProfileScreen} />
      </Stack.Navigator>
    </>
  );
};

export const ProfileStack = memo(Profile, isEqual);
