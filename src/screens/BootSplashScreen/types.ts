import { EScreens } from '@navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  [EScreens.LOGIN_SCREEN]: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
