import { Block } from '@components';
import { Colors } from '@core/styles';
import React, { useEffect } from 'react';
import RNBootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App: React.FC = () => {
  useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  // Экран загрузки
  // if (!isReady) {
  //   return (
  //     <Block flex={1} justifyContent="center" alignItems="center" backgroundColor={Colors.black}>
  //       <Image source={TransparentLogoAppImage} style={{ width: 200, height: 200 }} />
  //     </Block>
  //   );
  // }

  // if (error) {
  //   return (
  //     <Block flex={1} justifyContent="center" alignItems="center" backgroundColor={Colors.black}>
  //       <Image source={TransparentLogoAppImage} style={{ width: 200, height: 200 }} />
  //       <Block marginTop={20}>
  //         <Typography.B16 color={Colors.error} textAlign="center">
  //           Ошибка загрузки приложения
  //         </Typography.B16>
  //         <Typography.R14 color={Colors.textSecondary} textAlign="center" marginTop={8}>
  //           {error}
  //         </Typography.R14>
  //       </Block>
  //     </Block>
  //   );
  // }

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Block flex={1} backgroundColor={Colors.blue}></Block>
    </GestureHandlerRootView>
  );
};

export default App;
