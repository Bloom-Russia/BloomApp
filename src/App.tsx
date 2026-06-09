import { TransparentLogoAppImage } from '@assets/images';
import { AuthProvider } from '@contexts';
import { AppNavigation } from '@navigation';
import { AxiosService, NotificationCoordinator } from '@services';
import { Block, Colors } from '@UIKit';
import { noop } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async (): Promise<void> => {
      try {
        const success = await AxiosService.initializeWithAppDefaults();
        if (success) {
          setIsInitialized(true);
        } else {
          setError('Не удалось инициализировать сервисы приложения');
        }
      } catch (err) {
        setError('Ошибка инициализации приложения');
        console.error(err);
      }
    };

    initApp().then(() => noop);
  }, []);

  if (error || !isInitialized) {
    return (
      <SafeAreaProvider>
        <Block flex={1} backgroundColor={Colors.black} justifyContent="center" alignItems="center">
          <Logo source={TransparentLogoAppImage} />
        </Block>
      </SafeAreaProvider>
    );
  }

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <KeyboardProvider>
          <SafeAreaProvider>
            <NotificationCoordinator />
            <AppNavigation />
          </SafeAreaProvider>
        </KeyboardProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

const Logo = styled(Image)({
  width: 250,
  height: 250,
});

export default App;
