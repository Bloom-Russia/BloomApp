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
};

export type ProfileStackParamList = {
  [EScreens.PROFILE_SCREEN]: undefined;
  [EScreens.EDIT_PROFILE_SCREEN]: undefined;
};

// export type RootModalsStackParamList = {
//   [EScreens.MODAL_CONFIRMATION_BY_PHONE_SCREEN]: undefined;
//   [EScreens.MODAL_CHECK_BY_INN_SCREEN]: undefined;
//   [EScreens.MODAL_HOW_BECOME_SELF_EMPLOYMENT_SCREEN]: undefined;
//   [EScreens.MODAL_CONFIRMATION_WRONG_PHONE_SCREEN]: undefined;
//   [EScreens.MODAL_CONFIRMATION_WRONG_INN_SCREEN]: { errorMessage: string };
//   [EScreens.MODAL_SENDING_PASSPORT_SUCCESSFULLY_SCREEN]: undefined;
//   [EScreens.MODAL_ADD_PASSPORT_PROFILE_SCREEN]: undefined;
//   [EScreens.MODAL_LOGOUT_SCREEN]: undefined;
//   [EScreens.MODAL_DELETE_PROFILE_SCREEN]: undefined;
//   [EScreens.MODAL_DOCUMENT_SIGNATURE_SCREEN]: {
//     title: string;
//     uuids: string | string[];
//     isActs: boolean;
//     callBack?: (value: boolean) => void;
//   };
//   [EScreens.MODAL_TRANSACTION_CONFIRMATION_SCREEN]: {
//     onPressConfirm: () => void;
//   };
//   [EScreens.MODAL_OPERATION_COMPLETED_SCREEN]: undefined;
//   [EScreens.MODAL_PROCESSING_SCREEN]: undefined;
//   [EScreens.MODAL_SIGNATURE_AGREEMENTS_SCREEN]: {
//     title: string;
//     subTitle: string;
//     callBack?: (value: boolean) => void;
//   };
//   [EScreens.MODAL_SIGN_DOCUMENTS_SCREEN]: undefined;
//   [EScreens.MODAL_PASSPORT_REJECTED_SCREEN]: undefined;
//   [EScreens.MODAL_REPLY_SCREEN]: undefined;
// };

//TABS
// export type ProfileStackProps = NativeStackScreenProps<
//   RootTabParamList,
//   EScreens.PROFILE_STACK
// >;
//
// export type MyWorkStackProps = NativeStackScreenProps<
//   RootTabParamList,
//   EScreens.MY_WORK_STACK
// >;
//
// export type WalletStackProps = NativeStackScreenProps<
//   RootTabParamList,
//   EScreens.WALLET_STACK
// >;
//
// export type VacanciesStackProps = NativeStackScreenProps<
//   RootTabParamList,
//   EScreens.VACANCIES_STACK
// >;

// export type RootTabParamList = {
//   [EScreens.PROFILE_STACK]: undefined;
//   [EScreens.WALLET_STACK]: undefined;
//   [EScreens.MY_WORK_STACK]: undefined;
//   [EScreens.VACANCIES_STACK]: undefined;
// };

// export type ProfileStackParamList = {
//   [EScreens.PROFILE_SCREEN]: undefined;
//   [EScreens.ABOUT_SCREEN]: undefined;
//   [EScreens.MY_DOCUMENTS_SCREEN]: { resetNavigation: boolean };
//   [EScreens.UPLOAD_PASSPORT_SCREEN]: undefined;
//   [EScreens.PASSPORT_CONFIRMATION_SCREEN]: { photo: Asset; isCamera: boolean };
//   [EScreens.SELF_EMPLOYMENT_CHECK_SCREEN]: undefined;
//   [EScreens.ACTS_AGREEMENTS_SCREEN]: { useAgreements?: boolean };
//   [EScreens.AGREEMENT_PDF_SCREEN]: { uuid: string; title: string };
//   [EScreens.ACT_PDF_SCREEN]: { uuid: string; title: string };
// } & RootModalsStackParamList;
//
// export type VacanciesStackParamList = {
//   [EScreens.VACANCIES_SCREEN]: undefined;
// } & RootModalsStackParamList;
//
// export type MyWorkStackParamList = {
//   [EScreens.MY_WORK_SCREEN]: undefined;
// } & RootModalsStackParamList;
//
// export type WalletStackParamList = {
//   [EScreens.WALLET_SCREEN]: undefined;
//   [EScreens.TRANSACTIONS_HISTORY_SCREEN]: undefined;
// } & RootModalsStackParamList;
