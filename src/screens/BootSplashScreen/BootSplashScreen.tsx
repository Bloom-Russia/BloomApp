import { EScreens, UnAuthStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, FocusAwareStatusBar } from '@UIKit';
import React from 'react';
import { AnimatedSplash } from './components/AnimatedSplash';

type BootSplashScreenProps = NativeStackScreenProps<
  UnAuthStackParamList,
  EScreens.BOOT_SPLASH_SCREEN
>;

const BootSplashScreen: React.FC<BootSplashScreenProps> = () => {
  return (
    <Block flex={1} backgroundColor={Colors.black}>
      <FocusAwareStatusBar barStyle={'dark-content'} translucent animated={true} />
      <AnimatedSplash />
    </Block>
  );
};

export default BootSplashScreen;
