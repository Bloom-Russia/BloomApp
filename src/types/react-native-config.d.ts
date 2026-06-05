declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    BOOT_SPLASH_DURATION: string;
    RESEND_TIMEOUT: string;
    ERROR_TIMEOUT: string;
    START_DELAY: string;
    ANIMATION_DURATION: string;
    FADE_DURATION: string;
    FALLBACK_TIMEOUT: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
