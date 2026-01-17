import { Block, Colors } from '@UIKit';
import LottieView from 'lottie-react-native';
import { Animated } from 'react-native';
import styled from 'styled-components/native';

export const Container = styled(Block)({
  flex: 1,
  backgroundColor: Colors.systemDark,
  justifyContent: 'center',
  alignItems: 'center',
});

export const AnimatedContainer = styled(Animated.createAnimatedComponent(Block))({
  justifyContent: 'center',
  alignItems: 'center',
});

export const StyledLottie = styled(LottieView)({
  width: 350,
  height: 350,
});
