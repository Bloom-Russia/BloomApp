import { LOTTIE } from '@assets/lottie';
import React from 'react';
import { useAnimatedSplash } from '../hooks';
import { AnimatedContainer, Container, StyledLottie } from './styledComponents';

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
