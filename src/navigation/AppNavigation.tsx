import { useNavigationService } from '@hooks';
import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback } from 'react';
import RNBootSplash from 'react-native-bootsplash';
import { RootNavigation } from './RootNavigator'; // самый вероятный вариант

export const AppNavigation: React.FC = () => {
  const navigationRef = useNavigationService();

  const onAnimationFinishAnimation = useCallback(async () => {
    await RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <NavigationContainer onReady={onAnimationFinishAnimation} ref={navigationRef}>
      <RootNavigation />
    </NavigationContainer>
  );
};
