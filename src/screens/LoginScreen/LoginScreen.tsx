import { RoundLogoAppImage } from '@assets/images';
import { useCustomAlert, useLoading } from '@hooks';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
// Импортируем messaging для работы с уведомлениями
import { ApiClientService } from '@services';
import { Block, Button, Colors, ESpacings, IconNames, Row, ScreenContainer } from '@UIKit';
import React, { memo, useCallback, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import {
  BackHandler,
  Image,
  Linking,
  PermissionsAndroid,
  PermissionStatus,
  Platform,
} from 'react-native';
import styled from 'styled-components';
import { MaskedInput } from './components/MaskInput';
import { CONSTANTS } from './constants';
import type { LoginScreenProps } from './types'; // Изменено здесь

const LoginScreenComponent: React.FC<LoginScreenProps> = () => {
  const [phone, setPhone] = React.useState<string>('');
  const isButtonDisabled = phone.length < CONSTANTS.MIN_PHONE_LENGTH;
  const { loading, showLoader, hideLoader } = useLoading();
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    // Очистка при размонтировании компонента
    return () => backHandler.remove();
  }, []);

  // Функция проверки статуса уведомлений
  const checkNotificationStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus: FirebaseMessagingTypes.AuthorizationStatus =
          await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } else if (Platform.OS === 'android') {
        // Для Android версий >= 13 (API 33)
        if (Platform.Version >= 33) {
          const granted: PermissionStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // Для Android версий < 13 всегда возвращаем true
        // так как уведомления включены по умолчанию до Android 13
        return true;
      }
      // Для других платформ
      return true;
    } catch (error) {
      console.error('Ошибка при проверке разрешения на уведомлений:', error);
      // В случае ошибки проверяем текущие настройки
      if (Platform.OS === 'ios') {
        const settings = await messaging().hasPermission();
        return (
          settings === messaging.AuthorizationStatus.AUTHORIZED ||
          settings === messaging.AuthorizationStatus.PROVISIONAL
        );
      }

      return true; // По умолчанию разрешаем
    }
  }, []);

  useEffect(() => {
    const checkNotification = async () => {
      const notificationsEnabled = await checkNotificationStatus();
      if (!notificationsEnabled) {
        // Показываем алерт с предложением включить уведомления
        showAlert({
          title: 'Уведомления отключены',
          message:
            'Для получения кода верификации необходимо включить уведомления. Так же вы будете всегда в курсе событий. Хотите включить их сейчас?',
          type: 'error',
          theme: 'dark',
          showIcon: true,
          buttons: [
            {
              text: 'Отмена',
              style: 'cancel',
              showButtonIcon: true,
              buttonIconName: IconNames.cancel,
            },
            {
              text: 'Включить',
              style: 'default',
              showButtonIcon: true,
              buttonIconName: IconNames.success,
              onPress: () => {
                // Перенаправляем пользователя в настройки уведомлений
                // Для IOS
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  // Для Android
                  Linking.openSettings();
                }
              },
            },
          ],
        });
        return;
      }
    };

    // Проверяем статус уведомлений
    checkNotification().then(() => console.log('Проверяем статус уведомлений'));
  }, [checkNotificationStatus, showAlert]);

  const requestVerificationCode = useCallback(async () => {
    if (isButtonDisabled) {
      return;
    }
    try {
      showLoader();
      await ApiClientService.requestVerificationCode({ phone });
      // После успешной отправки выполняем навигацию на экран ввода кода из авторизации
      // navigation.navigate('VerificationScreen', { phone });
    } catch (error: unknown) {
      console.error('Ошибка получения кода', error);
      // Можно показать ошибку пользователю
      showAlert({
        title: 'Ошибка',
        message: 'Внутренняя ошибка сервера',
        type: 'error',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      hideLoader();
    }
  }, [isButtonDisabled, showLoader, phone, showAlert, hideLoader]);

  return (
    <ScreenContainer title={'Авторизация'} paddingHorizontal={ESpacings.s16}>
      <Block flex={1} justifyContent="center">
        <Row justifyContent="center">
          <Logo source={RoundLogoAppImage} />
        </Row>
        <MaskedInput phone={phone} setPhone={setPhone} />
        <Button
          loading={loading}
          disabled={isButtonDisabled}
          paddingTop={140}
          title={'Запросить код'}
          onPress={requestVerificationCode}
          color={Colors.blue}
        />
      </Block>
      <AlertComponent />
    </ScreenContainer>
  );
};

export const LoginScreen = memo(LoginScreenComponent, isEqual);

const Logo = styled(Image)({
  width: 100,
  height: 100,
  marginBottom: 60,
});
