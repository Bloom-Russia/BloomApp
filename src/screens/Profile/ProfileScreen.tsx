import { useAuth } from '@contexts';
import { useErrorWithTimeout, useHandleExitApp } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SecureStorageService } from '@services';
import { useAppStore, useUserStore } from '@store';
import {
  Avatar,
  Block,
  Button,
  Colors,
  ESpacings,
  IconNames,
  ScreenContainer,
  Spinner,
  Typography,
  UserDataItem,
} from '@UIKit';
import { formatPhoneNumber, getSelectedName, getSelectedNames } from '@utils';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import ReactNativeBiometrics from 'react-native-biometrics';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

const ProfileScreenComponent: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { fetchUserByPhoneNumber, deleteUser, clearUserData, user } = useUserStore();
  const { cities, professions } = useAppStore().app;
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
      hideBackIcon
    >
      <Block flex={1} padding={ESpacings.s16}>
        <Block flex={1} marginBottom={ESpacings.s24}>
          <Block alignItems={'center'} marginBottom={ESpacings.s24}>
            <Avatar source={user.avatarUrl} />
          </Block>
          <Typography.B24 marginBottom={ESpacings.s24} textAlign={'center'} color={Colors.white}>
            {user.fullName}
          </Typography.B24>
          <UserDataItem
            marginBottom={ESpacings.s16}
            value={formatPhoneNumber(user.phoneNumber)}
            label={'Телефон'}
          />
          <UserDataItem marginBottom={ESpacings.s16} value={user.email} label={'Email'} />
          <UserDataItem marginBottom={ESpacings.s16} value={user.telegram} label={'Telegram'} />
          <UserDataItem
            marginBottom={ESpacings.s16}
            value={formatPhoneNumber(user.max)}
            label={'Max'}
          />
          <UserDataItem marginBottom={ESpacings.s16} value={user.experience} label={'Опыт'} />
          <UserDataItem
            marginBottom={ESpacings.s16}
            value={getSelectedName(user.city, cities)}
            label={'Город'}
          />
          <UserDataItem
            marginBottom={ESpacings.s16}
            value={getSelectedNames(user.professions, professions)}
            label={'Профессии'}
          />
          <UserDataItem value={user.address} label={'Адрес студии'} />
        </Block>
        <Button
          title={'Выйти из приложения'}
          loading={exiting}
          onPress={handleExitApp}
          paddingHorizontal={ESpacings.s16}
          marginBottom={ESpacings.s24}
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
