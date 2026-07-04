import 'reflect-metadata';
import { I18nProvider, StoreProvider } from '@app/providers';
import { TransparentLogoAppImage } from '@assets/images';
import { Block } from '@components/common';
import { container } from '@core/di/container';
import { Colors } from '@core/styles';
import { AppNavigator } from '@navigation/AppNavigator';
import { AxiosService, NotificationCoordinator } from '@services';
import { RootStore } from '@stores/RootStore';
import { noop } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components';

const rootStore = container.resolve(RootStore);

const App: React.FC = () => {
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async (): Promise<void> => {
      try {
        const success = await AxiosService.initializeWithAppDefaults();
        if (success) {
          setIsInitialized(true);
        } else {
          setError(t('common.error'));
        }
      } catch (err) {
        setError(t('common.error'));
        console.error('App initialization error:', err);
      }
    };

    initApp().then(noop);
  }, [t]);

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
      <StoreProvider store={rootStore}>
        <I18nProvider>
          <KeyboardProvider>
            <SafeAreaProvider>
              <NotificationCoordinator />
              <AppNavigator />
            </SafeAreaProvider>
          </KeyboardProvider>
        </I18nProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
};

const Logo = styled(Image)({
  width: 250,
  height: 250,
});

export default observer(App);
