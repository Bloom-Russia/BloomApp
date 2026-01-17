import { TransparentLogoAppImage } from '@assets/images';
import { AuthProvider } from '@contexts';
import { AxiosService } from '@services';
import { Block, Colors } from '@UIKit';
// ✅ Убедитесь в правильности импортов
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components';

// Создаем внутренний компонент для использования safe area
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

    initApp();
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
    <AlertNotificationRoot>
      <AuthProvider>
        <KeyboardProvider>
          <SafeAreaProvider>
            <Block flex={1} backgroundColor={'red'} />
          </SafeAreaProvider>
        </KeyboardProvider>
      </AuthProvider>
    </AlertNotificationRoot>
  );
};

const Logo = styled(Image)({
  width: 250,
  height: 250,
});

export default App;
