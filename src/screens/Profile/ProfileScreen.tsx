import { useErrorWithTimeout } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUserStore } from '@store';
import { Block, Colors, ESpacings, IconNames, ScreenContainer, Spinner, Typography } from '@UIKit';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

const ProfileScreenComponent: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { fetchUserByPhoneNumber } = useUserStore();
  const [loading, setLoading] = useState<boolean>(false);
  const { setErrorMessageWithTimeout, cleanupErrors } = useErrorWithTimeout();

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupErrors();
    };
  }, [cleanupErrors]);

  const getUserData = useCallback(async () => {
    await fetchUserByPhoneNumber({
      options: {
        changeLoading: setLoading,
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <ScreenContainer
      reload={getUserData}
      icon={IconNames.edit}
      onPressIcon={navigateToEditProfile}
      title={'Профиль'}
      paddingHorizontal={ESpacings.s16}
    >
      <Block flex={1} justifyContent={'center'}>
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          My Profile Screen
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const ProfileScreen = memo(ProfileScreenComponent, isEqual);
