import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EScreens } from './types';

export type RootStackParamList = {
  [EScreens.AUTHORIZATION_STACK]: undefined;
  [EScreens.UN_AUTHORIZATION_STACK]: undefined;
};

export type AuthorizationStackProps = NativeStackScreenProps<RootStackParamList>;
export type UnAuthorizationStackProps = NativeStackScreenProps<RootStackParamList>;
export type HomeStackProps = NativeStackScreenProps<HomeStackParamList>;
export type ChatStackProps = NativeStackScreenProps<ChatStackParamList>;
export type MyWorksStackProps = NativeStackScreenProps<MyWorksStackParamList>;
export type ProfileStackProps = NativeStackScreenProps<ProfileStackParamList>;

export type UnAuthStackParamList = {
  [EScreens.BOOT_SPLASH_SCREEN]: undefined;
  [EScreens.LOGIN_SCREEN]: undefined;
  [EScreens.SMS_CONFIRM_SCREEN]: {
    phone: string;
  };
  [EScreens.AUTH_PIN_CODE_SCREEN]: undefined;
};

export type AuthStackParamList = {
  [EScreens.AUTH_PIN_CODE_SCREEN]: undefined;
  [EScreens.ON_BOARDING_SCREEN]: undefined;
  [EScreens.TABS_STACK]: undefined;
};

export type RootTabParamList = {
  [EScreens.HOME_STACK]: undefined;
  [EScreens.CHAT_STACK]: undefined;
  [EScreens.MY_WORKS_STACK]: undefined;
  [EScreens.PROFILE_STACK]: undefined;
};

export type HomeStackParamList = {
  [EScreens.HOME_SCREEN]: undefined;
};

export type ChatStackParamList = {
  [EScreens.CHAT_SCREEN]: undefined;
};

export type MyWorksStackParamList = {
  [EScreens.MY_WORKS_SCREEN]: undefined;
  [EScreens.CREATE_WORK_SCREEN]: undefined;
};

export type ProfileStackParamList = {
  [EScreens.PROFILE_SCREEN]: undefined;
  [EScreens.EDIT_PROFILE_SCREEN]: undefined;
};
