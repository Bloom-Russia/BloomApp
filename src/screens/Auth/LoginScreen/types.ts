import { EScreens, UnAuthStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type LoginScreenProps = NativeStackScreenProps<UnAuthStackParamList, EScreens.LOGIN_SCREEN>;

export interface ServerErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export type LoginFormValues = {
  phone: string;
};
