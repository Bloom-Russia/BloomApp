import { Colors, Typography } from '@UIKit';
import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';

const CURSOR_CONSTANTS = {
  ANIMATION_DURATION: 500,
};

export const AnimatedCursor: React.FC = () => {
  const [opacity] = useState(new Animated.Value(1));

  useEffect(() => {
    const startBlinking = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: CURSOR_CONSTANTS.ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: CURSOR_CONSTANTS.ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    startBlinking();

    return () => {
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Typography.B14 color={Colors.black}>|</Typography.B14>
    </Animated.View>
  );
};
