import { useAuth } from '@contexts';
import { useErrorWithTimeout, useHandleExitApp } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SecureStorageService } from '@services';
import { useUserStore } from '@store';
import {
  Block,
  Button,
  Colors,
  ESpacings,
  IconNames,
  ScreenContainer,
  Spinner,
  Typography,
} from '@UIKit';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import ReactNativeBiometrics from 'react-native-biometrics';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

const ProfileScreenComponent: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { fetchUserByPhoneNumber, deleteUser, clearUserData } = useUserStore();
  const { setIsVerified } = useAuth();

  const [fetchingUser, setFetchingUser] = useState<boolean>(false);
  const [exiting, setExiting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const { setErrorMessageWithTimeout, cleanupErrors, showAlert, AlertComponent } =
    useErrorWithTimeout();
  const { handleExitApp } = useHandleExitApp(showAlert, setExiting);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupErrors();
    };
  }, [cleanupErrors]);

  const deleteUserHandler = useCallback(async () => {
    showAlert({
      title: 'Удалить пользователя?',
      message:
        'Вы уверены, что хотите удалить свой аккаунт? Все данные будут потеряны без возможности восстановления.',
      type: 'question',
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
          text: 'Удалить',
          style: 'default',
          showButtonIcon: true,
          buttonIconName: IconNames.warning,
          onPress: async () => {
            const { success } = await deleteUser({
              options: {
                changeLoading: setDeleting,
                errorCodeCallBack: setErrorMessageWithTimeout,
              },
            });
            if (success) {
              await clearUserData();
              try {
                const biometrics = new ReactNativeBiometrics();
                const { keysExist } = await biometrics.biometricKeysExist();
                if (keysExist) {
                  await biometrics.deleteKeys();
                }
              } catch (error) {
                console.error('Ошибка удаления биометрических ключей:', error);
              }
              await SecureStorageService.clearAll();
              await setIsVerified(false);
            }
          },
        },
      ],
    });
  }, [clearUserData, deleteUser, setErrorMessageWithTimeout, setIsVerified, showAlert]);

  const getUserData = useCallback(async () => {
    await fetchUserByPhoneNumber({
      options: {
        changeLoading: setFetchingUser,
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });
  }, [fetchUserByPhoneNumber, setErrorMessageWithTimeout]);

  const reloadUserData = useCallback(async () => {
    await fetchUserByPhoneNumber({
      options: {
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });
  }, [fetchUserByPhoneNumber, setErrorMessageWithTimeout]);

  useEffect(() => {
    getUserData().then(noop);
  }, [getUserData]);

  const navigateToEditProfile = useCallback(() => {
    navigation.navigate(EScreens.EDIT_PROFILE_SCREEN);
  }, [navigation]);

  if (fetchingUser) {
    return <Spinner />;
  }

  return (
    <ScreenContainer
      reload={reloadUserData}
      icon={IconNames.edit}
      onPressIcon={navigateToEditProfile}
      title={'Профиль'}
      paddingHorizontal={ESpacings.s16}
    >
      <Block flex={1} justifyContent={'center'}>
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          My Profile Screen
        </Typography.B14>
        <Button
          title={'Выйти'}
          loading={exiting}
          onPress={handleExitApp}
          paddingHorizontal={ESpacings.s16}
          marginBottom={ESpacings.s38}
        />
        <Button
          title={'Удалить пользователя'}
          color={Colors.red}
          loading={deleting}
          onPress={deleteUserHandler}
          paddingHorizontal={ESpacings.s16}
        />
      </Block>
      <AlertComponent />
    </ScreenContainer>
  );
};

export const ProfileScreen = memo(ProfileScreenComponent, isEqual);
