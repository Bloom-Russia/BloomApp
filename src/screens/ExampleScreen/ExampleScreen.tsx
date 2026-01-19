import { useLogOut } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Button, Colors, ESpacings, Typography } from '@UIKit';
import React from 'react';

type ExampleScreenProps = NativeStackScreenProps<AuthStackParamList, EScreens.EXAMPLE_SCREEN>;

export const ExampleScreen: React.FC<ExampleScreenProps> = () => {
  const { logOutHandler } = useLogOut();

  return (
    <Block
      flex={1}
      backgroundColor={Colors.black}
      justifyContent={'center'}
      padding={ESpacings.s16}
    >
      <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
        Вы удачно авторизовались!!!
      </Typography.B14>
      <Button title={'Сменить пользователя'} onPress={logOutHandler} />
    </Block>
  );
};
