export enum EScreens {
  // ===== СТЕКИ =====
  /** Стек для авторизованных пользователей */
  AUTHORIZATION_STACK = 'AuthorizationStack',
  /** Стек для неавторизованных пользователей */
  UN_AUTHORIZATION_STACK = 'UnAuthorizationStack',
  /** Вкладки (Tab Navigator) */
  TABS_STACK = 'TabsStack',

  // ===== ВКЛАДКИ =====
  PROFILE_STACK = 'ProfileStack',
  HOME_STACK = 'HomeStack',
  CHAT_STACK = 'ChatStack',
  APPOINTMENTS_STACK = 'AppointmentsStack',

  // ===== ЭКРАНЫ АУТЕНТИФИКАЦИИ =====
  /** Экран загрузки/сплэш */
  BOOT_SPLASH_SCREEN = 'BootSplashScreen',
  /** Экран входа (ввод телефона) */
  LOGIN_SCREEN = 'LoginScreen',
  /** Экран подтверждения SMS */
  SMS_CONFIRM_SCREEN = 'SmsConfirmScreen',
  /** Экран ввода PIN-кода */
  AUTH_PIN_CODE_SCREEN = 'AuthPinCodeScreen',

  // ===== ЭКРАНЫ ОНБОРДИНГА =====
  /** Экран онбординга */
  ON_BOARDING_SCREEN = 'OnBoardingScreen',

  // ===== ОСНОВНЫЕ ЭКРАНЫ =====
  /** Главный экран */
  HOME_SCREEN = 'HomeScreen',
  /** Чат */
  CHAT_SCREEN = 'ChatScreen',
  /** Список записей */
  APPOINTMENTS_SCREEN = 'AppointmentsScreen',
  /** Создание записи */
  CREATE_APPOINTMENT_SCREEN = 'CreateAppointmentScreen',
  /** Профиль пользователя */
  PROFILE_SCREEN = 'ProfileScreen',
  /** Редактирование профиля */
  EDIT_PROFILE_SCREEN = 'EditProfileScreen',
}

/** Тип для всех параметров экранов */
export type ScreenParams = {
  // Auth Screens
  [EScreens.BOOT_SPLASH_SCREEN]: undefined;
  [EScreens.LOGIN_SCREEN]: undefined;
  [EScreens.SMS_CONFIRM_SCREEN]: { phone: string };
  [EScreens.AUTH_PIN_CODE_SCREEN]: undefined;

  // Onboarding
  [EScreens.ON_BOARDING_SCREEN]: undefined;

  // Main Screens
  [EScreens.HOME_SCREEN]: undefined;
  [EScreens.CHAT_SCREEN]: undefined;
  [EScreens.APPOINTMENTS_SCREEN]: undefined;
  [EScreens.CREATE_APPOINTMENT_SCREEN]: { serviceId?: string };
  [EScreens.PROFILE_SCREEN]: undefined;
  [EScreens.EDIT_PROFILE_SCREEN]: undefined;
};

/** Общий тип для стэков */
export type RootStackParamList = {
  [EScreens.AUTHORIZATION_STACK]: undefined;
  [EScreens.UN_AUTHORIZATION_STACK]: undefined;
  [EScreens.TABS_STACK]: undefined;
};

/** Тип для неавторизованного стэка */
export type UnAuthStackParamList = {
  [EScreens.BOOT_SPLASH_SCREEN]: undefined;
  [EScreens.LOGIN_SCREEN]: undefined;
  [EScreens.SMS_CONFIRM_SCREEN]: { phone: string };
  [EScreens.AUTH_PIN_CODE_SCREEN]: undefined;
};

/** Тип для авторизованного стэка */
export type AuthStackParamList = {
  [EScreens.AUTH_PIN_CODE_SCREEN]: undefined;
  [EScreens.ON_BOARDING_SCREEN]: undefined;
  [EScreens.TABS_STACK]: undefined;
};

/** Тип для Tab Navigator */
export type RootTabParamList = {
  [EScreens.HOME_STACK]: undefined;
  [EScreens.CHAT_STACK]: undefined;
  [EScreens.APPOINTMENTS_STACK]: undefined;
  [EScreens.PROFILE_STACK]: undefined;
};

/** Тип для стэка Home */
export type HomeStackParamList = Pick<ScreenParams, EScreens.HOME_SCREEN>;

/** Тип для стэка Chat */
export type ChatStackParamList = Pick<ScreenParams, EScreens.CHAT_SCREEN>;

/** Тип для стэка Appointments */
export type AppointmentsStackParamList = Pick<
  ScreenParams,
  EScreens.APPOINTMENTS_SCREEN | EScreens.CREATE_APPOINTMENT_SCREEN
>;

/** Тип для стэка Profile */
export type ProfileStackParamList = Pick<
  ScreenParams,
  EScreens.PROFILE_SCREEN | EScreens.EDIT_PROFILE_SCREEN
>;

import { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Пропсы для RootNavigator */
export type RootNavigationProps = NativeStackScreenProps<RootStackParamList>;

/** Пропсы для UnauthorizedStack */
export type UnauthorizedStackProps = NativeStackScreenProps<RootStackParamList>;

/** Пропсы для AuthenticationStack */
export type AuthenticationStackProps = NativeStackScreenProps<RootStackParamList>;

/** Пропсы для экранов */
export type LoginScreenProps = NativeStackScreenProps<UnAuthStackParamList, EScreens.LOGIN_SCREEN>;
export type SmsConfirmScreenProps = NativeStackScreenProps<
  UnAuthStackParamList,
  EScreens.SMS_CONFIRM_SCREEN
>;
export type PinCodeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  EScreens.AUTH_PIN_CODE_SCREEN
>;
export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, EScreens.HOME_SCREEN>;
export type ProfileScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  EScreens.PROFILE_SCREEN
>;
export type EditProfileScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  EScreens.EDIT_PROFILE_SCREEN
>;
export type AppointmentsScreenProps = NativeStackScreenProps<
  AppointmentsStackParamList,
  EScreens.APPOINTMENTS_SCREEN
>;
export type CreateAppointmentScreenProps = NativeStackScreenProps<
  AppointmentsStackParamList,
  EScreens.CREATE_APPOINTMENT_SCREEN
>;
export type ChatScreenProps = NativeStackScreenProps<ChatStackParamList, EScreens.CHAT_SCREEN>;
