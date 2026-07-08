import { I18nProvider, StoreProvider } from '@app/providers';
import { TransparentLogoAppImage } from '@assets/images';
import { Block, Typography } from '@components';
import { container } from '@core/di';
import { Colors } from '@core/styles';
import { AppNavigator } from '@navigation';
import { AxiosService } from '@services';
import { noop } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components';

const rootStore = container.getRootStore();

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await AxiosService.initializeWithAppDefaults(null);
        await rootStore.initialize();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsReady(true);
      }
    };
    init().then(noop);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <Block flex={1} justifyContent="center" alignItems="center" backgroundColor={Colors.black}>
          <Logo source={TransparentLogoAppImage} />
        </Block>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <Block flex={1} justifyContent="center" alignItems="center" backgroundColor={Colors.black}>
          <Logo source={TransparentLogoAppImage} />
          <Block marginTop={20}>
            <Typography.B16 color={Colors.error} textAlign="center">
              Ошибка загрузки приложения
            </Typography.B16>
            <Typography.R14 color={Colors.textSecondary} textAlign="center" marginTop={8}>
              {error}
            </Typography.R14>
          </Block>
        </Block>
      </SafeAreaProvider>
    );
  }

  return (
    <StyledGestureHandlerRootView>
      <StoreProvider store={rootStore}>
        <I18nProvider>
          <KeyboardProvider>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </KeyboardProvider>
        </I18nProvider>
      </StoreProvider>
    </StyledGestureHandlerRootView>
  );
};

export default observer(App);

const Logo = styled(Image)({
  width: 200,
  height: 200,
});

const StyledGestureHandlerRootView = styled(GestureHandlerRootView)({
  flex: 1,
});
