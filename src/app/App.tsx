import { TransparentLogoAppImage } from '@assets/images';
import { Block } from '@components';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { Image } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import styled from 'styled-components';

const App: React.FC = () => {
  // const { t } = useTranslation();
  // const [isInitialized, setIsInitialized] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const initApp = async (): Promise<void> => {
  //     try {
  //       // 1. Инициализация Axios
  //       const success = await AxiosService.initializeWithAppDefaults(
  //         container.getSecureStorageRepository(),
  //       );
  //
  //       if (!success) {
  //         setError(t('common.error'));
  //         return;
  //       }
  //
  //       // 2. Инициализация RootStore (уведомления и т.д.)
  //       await rootStore.initialize();
  //
  //       setIsInitialized(true);
  //     } catch (err) {
  //       setError(t('common.error'));
  //       console.error('App initialization error:', err);
  //     }
  //   };
  //
  //   initApp().then(noop);
  // }, [t]);

  // if (error || !isInitialized) {
  //   return (
  //     <SafeAreaProvider>
  //       <Block flex={1} backgroundColor={Colors.black} justifyContent="center" alignItems="center">
  //         <Logo source={TransparentLogoAppImage} />
  //       </Block>
  //     </SafeAreaProvider>
  //   );
  // }

  useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <Block>
      <Logo source={TransparentLogoAppImage} />
    </Block>
  );
};

const Logo = styled(Image)({
  width: 250,
  height: 250,
});

export default observer(App);
