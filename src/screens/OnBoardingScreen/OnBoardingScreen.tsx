import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, Typography } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';

type OnBoardingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  EScreens.ON_BOARDING_SCREEN
>;

const OnBoardingScreenComponent: React.FC<OnBoardingScreenProps> = () => {
  return (
    <Block
      flex={1}
      backgroundColor={Colors.black}
      justifyContent={'center'}
      padding={ESpacings.s16}
    >
      <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
        ON_BOARDING_SCREEN
      </Typography.B14>
    </Block>
  );
};

export const OnBoardingScreen = memo(OnBoardingScreenComponent, isEqual);
