import { useLogOut } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Button, Colors, ESpacings, Typography } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

const ProfileScreenComponent: React.FC<ProfileScreenProps> = () => {
  const { logOutHandler } = useLogOut();
  return (
    <Block
      flex={1}
      backgroundColor={Colors.black}
      justifyContent={'center'}
      padding={ESpacings.s16}
    >
      <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
        Profile Screen
      </Typography.B14>
      <Button title={'Сменить пользователя'} onPress={logOutHandler} />
    </Block>
  );
};

export const ProfileScreen = memo(ProfileScreenComponent, isEqual);
