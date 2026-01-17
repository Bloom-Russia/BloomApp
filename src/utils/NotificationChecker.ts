import messaging from '@react-native-firebase/messaging';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

const NotificationChecker = (): null => {
  const requestIOSPermissions = useCallback(async (): Promise<void> => {
    try {
      const authStatus = await messaging().requestPermission();

      if (authStatus) {
        console.log('iOS: Разрешение получено');

        // Регистрация для удаленных уведомлений
        await messaging().registerDeviceForRemoteMessages();

        const token = await messaging().getAPNSToken();
        console.log('APNS Token:', token);
      }
    } catch (error) {
      console.error('iOS permission error:', error);
    }
  }, []);

  const checkIOSPermissions = useCallback(async (): Promise<void> => {
    try {
      const authStatus = await messaging().hasPermission();

      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
        console.log('iOS: Уведомления разрешены');
      } else if (authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        console.log('iOS: Предварительные уведомления');
      } else {
        console.log('iOS: Требуется запрос разрешений');
        await requestIOSPermissions();
      }
    } catch (error) {
      console.error('iOS check error:', error);
    }
  }, [requestIOSPermissions]);

  const requestAndroidPermissions = useCallback(async (): Promise<void> => {
    try {
      const authStatus = await messaging().requestPermission();

      if (authStatus) {
        console.log('Android: Разрешение получено');

        const token = await messaging().getToken();
        console.log('Новый FCM Token:', token);
      }
    } catch (error) {
      console.error('Android permission error:', error);
    }
  }, []);

  const checkAndroidPermissions = useCallback(async (): Promise<void> => {
    try {
      const authStatus = await messaging().hasPermission();

      if (authStatus) {
        console.log('Android: Уведомления разрешены');

        // Получаем FCM токен
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      } else {
        console.log('Android: Требуется запрос разрешений');
        await requestAndroidPermissions();
      }
    } catch (error) {
      console.error('Android check error:', error);
    }
  }, [requestAndroidPermissions]);

  const checkNotificationPermissions = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      await checkIOSPermissions();
    } else {
      await checkAndroidPermissions();
    }
  }, [checkIOSPermissions, checkAndroidPermissions]);

  useEffect(() => {
    checkNotificationPermissions();
  }, [checkNotificationPermissions]);

  return null;
};

export default NotificationChecker;
