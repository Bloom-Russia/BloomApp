import { ACCESSIBLE } from 'react-native-keychain';

export interface SecureStorageOptions {
  accessible?: ACCESSIBLE;
  service?: string;
}

export interface SecureStorageResult<T = boolean> {
  success: boolean;
  data?: T;
  error?: Error | unknown;
}
