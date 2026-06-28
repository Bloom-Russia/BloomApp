import { RoundLogoAppImage } from '@assets/images';
import { useErrorWithTimeout } from '@hooks';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { ApiClientService } from '@services';
import {
  Block,
  Button,
  Colors,
  ESpacings,
  IconNames,
  MaskedPhoneInput,
  Row,
  ScreenContainer,
} from '@UIKit';
import React, { memo, useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import {
  BackHandler,
  Image,
  Keyboard,
  PermissionsAndroid,
  PermissionStatus,
  Platform,
} from 'react-native';
import { openSettings } from 'react-native-permissions';
import styled from 'styled-components';
import { CONSTANTS } from './constants';
import type { LoginScreenProps } from './types';

const LoginScreenComponent: React.FC<LoginScreenProps> = () => {
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const isButtonDisabled = phone.length < CONSTANTS.MIN_PHONE_LENGTH;

  const { showAlert, AlertComponent, setErrorMessageWithTimeout, cleanupErrors } =
    useErrorWithTimeout();

  useEffect(() => cleanupErrors, [cleanupErrors]);

  const setPhoneHandler = useCallback((value: string) => {
    if (value.length === CONSTANTS.MIN_PHONE_LENGTH) {
      Keyboard.dismiss();
    }
    setPhone(value);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const checkNotificationStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus: FirebaseMessagingTypes.AuthorizationStatus =
          await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } else if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted: PermissionStatus = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Ошибка при проверке разрешения на уведомления:', error);
      if (Platform.OS === 'ios') {
        const settings = await messaging().hasPermission();
        return (
          settings === messaging.AuthorizationStatus.AUTHORIZED ||
          settings === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
      return true;
    }
  }, []);

  useEffect(() => {
    const checkNotification = async () => {
      const notificationsEnabled = await checkNotificationStatus();
      if (!notificationsEnabled) {
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
              onPress: openSettings,
            },
          ],
        });
      }
    };

    checkNotification();
  }, [checkNotificationStatus, showAlert]);

  const requestVerificationCode = useCallback(async () => {
    if (isButtonDisabled) {
      return;
    }

    await ApiClientService.requestVerificationCode({
      phoneNumber: phone,
      options: {
        changeLoading: setLoading,
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });
  }, [isButtonDisabled, phone, setErrorMessageWithTimeout]);

  return (
    <ScreenContainer hideBackIcon title="Авторизация" paddingHorizontal={ESpacings.s16}>
      <Block flex={1} justifyContent="center">
        <Row justifyContent="center">
          <Logo source={RoundLogoAppImage} />
        </Row>
        <MaskedPhoneInput phone={phone} setPhone={setPhoneHandler} />
        <Button
          loading={loading}
          disabled={isButtonDisabled}
          paddingTop={140}
          title="Запросить код"
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
