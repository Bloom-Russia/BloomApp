export {};

type EmptyFunc = (...args: unknown[]) => void;

export type Tron = {
  log: EmptyFunc;
  error: EmptyFunc;
  warn: EmptyFunc;
  display: EmptyFunc;
};

declare global {
  interface Console {
    tron: Tron;
  }
}

declare module 'react-native-permissions' {
  export interface Permissions {
    readonly ANDROID: {
      readonly POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS';
    };
    readonly IOS: {
      readonly NOTIFICATIONS: 'ios.permission.NOTIFICATIONS';
    };
  }
}
