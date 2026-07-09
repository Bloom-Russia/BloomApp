import { LOTTIE } from '@assets/lottie';
import { Block } from '@components';
import { Colors } from '@core/styles';
import LottieView from 'lottie-react-native';
import React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components';
import { useAnimatedSplash } from '../hooks/useAnimatedSplash';

export const AnimatedSplash: React.FC = () => {
  const { isVisible, fadeAnim, lottieRef } = useAnimatedSplash();

  if (!isVisible) {
    return null;
  }

  return (
    <Container>
      <AnimatedContainer style={{ opacity: fadeAnim }}>
        <StyledLottie ref={lottieRef} source={LOTTIE} autoPlay={false} loop={false} />
      </AnimatedContainer>
    </Container>
  );
};

const Container = styled(Block)({
  flex: 1,
  backgroundColor: Colors.systemDark,
  justifyContent: 'center',
  alignItems: 'center',
});

const AnimatedContainer = styled(Animated.createAnimatedComponent(Block))({
  justifyContent: 'center',
  alignItems: 'center',
});

const StyledLottie = styled(LottieView)({
  width: 350,
  height: 350,
});
