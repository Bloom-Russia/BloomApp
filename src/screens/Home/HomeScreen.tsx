import { EScreens, HomeStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, ScreenContainer, Typography } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, EScreens.HOME_SCREEN>;

const HomeScreenComponent: React.FC<HomeScreenProps> = () => {
  return (
    <ScreenContainer hideBackIcon={true} title="Главная" paddingHorizontal={ESpacings.s16}>
      <Block
        flex={1}
        backgroundColor={Colors.black}
        justifyContent={'center'}
        padding={ESpacings.s16}
      >
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          Home Screen
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const HomeScreen = memo(HomeScreenComponent, isEqual);
