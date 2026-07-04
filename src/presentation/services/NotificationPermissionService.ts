import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

class NotificationPermissionServiceClass {
  private static instance: NotificationPermissionServiceClass;

  private constructor() {}

  static getInstance(): NotificationPermissionServiceClass {
    if (!NotificationPermissionServiceClass.instance) {
      NotificationPermissionServiceClass.instance = new NotificationPermissionServiceClass();
    }
    return NotificationPermissionServiceClass.instance;
  }

  /**
   * Проверка наличия разрешения на уведомления
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().hasPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } else if (Platform.OS === 'android' && Platform.Version >= 33) {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      return true;
    } catch (error) {
      console.error('[NotificationPermission] Error checking permission:', error);
      return false;
    }
  }

  /**
   * Запрос разрешения на уведомления
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } else if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('[NotificationPermission] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Проверка и запрос разрешения (если нет - запрашиваем)
   */
  async ensurePermission(): Promise<boolean> {
    const hasPermission = await this.checkPermission();
    if (hasPermission) {
      return true;
    }
    return await this.requestPermission();
  }
}

export default NotificationPermissionServiceClass.getInstance();
