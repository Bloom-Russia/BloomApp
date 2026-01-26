import { EScreens, UnAuthStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, FocusAwareStatusBar } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { AnimatedSplash } from './components/AnimatedSplash';

type BootSplashScreenProps = NativeStackScreenProps<
  UnAuthStackParamList,
  EScreens.BOOT_SPLASH_SCREEN
>;

const BootSplashScreenComponent: React.FC<BootSplashScreenProps> = () => {
  return (
    <Block flex={1} backgroundColor={Colors.black}>
      <FocusAwareStatusBar barStyle={'dark-content'} translucent animated={true} />
      <AnimatedSplash />
    </Block>
  );
};

export const BootSplashScreen = memo(BootSplashScreenComponent, isEqual);
