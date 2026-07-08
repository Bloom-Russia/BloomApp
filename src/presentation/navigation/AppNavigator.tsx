import { NavigationContainer } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import RNBootSplash from 'react-native-bootsplash';
import { RootNavigator } from './RootNavigator';

export const AppNavigator: React.FC = observer(() => {
  const onReady = useCallback(async () => {
    await RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <NavigationContainer onReady={onReady}>
      <RootNavigator />
    </NavigationContainer>
  );
});
