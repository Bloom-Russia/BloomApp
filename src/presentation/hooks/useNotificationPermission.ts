import { NotificationPermissionService } from '@services';
import { noop } from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform } from 'react-native';
import { openSettings } from 'react-native-permissions';

export const useNotificationPermission = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await NotificationPermissionService.checkPermission();

      if (!hasPermission) {
        Alert.alert(
          t('auth.notifications.disabledTitle'),
          t('auth.notifications.disabledMessage'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.enable'),
              onPress: () => {
                // ✅ Правильный способ открыть настройки
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  openSettings().catch(noop);
                }
              },
              style: 'default',
            },
          ],
        );
      }
    };

    checkPermission().then(noop);
  }, [t]);
};
