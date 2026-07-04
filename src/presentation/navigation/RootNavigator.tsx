import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { EScreens, RootStackParamList } from './types';
import { UnauthorizedStack } from './UnauthorizedStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = observer(() => {
  // const { authStore } = useStores();
  //const { isVerified, isLoading } = authStore;

  // Показываем индикатор загрузки пока проверяем статус
  // if (isLoading) {
  //   return (
  //     <Block flex={1} backgroundColor={Colors.black} justifyContent="center" alignItems="center">
  //       <Logo source={RoundLogoAppImage} />
  //       {/*<Spinner size="large" color={Colors.white} />*/}
  //     </Block>
  //   );
  // }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={EScreens.UN_AUTHORIZATION_STACK} component={UnauthorizedStack} />
      {/*{!isVerified ? (*/}
      {/*  <Stack.Screen name={EScreens.UN_AUTHORIZATION_STACK} component={UnauthorizedStack} />*/}
      {/*) : (*/}
      {/*  <Stack.Screen name={EScreens.AUTHORIZATION_STACK} component={AuthenticationStack} />*/}
      {/*)}*/}
    </Stack.Navigator>
  );
});

// const Logo = styled(Image)({
//   width: 250,
//   height: 250,
//   marginBottom: 20,
// });
