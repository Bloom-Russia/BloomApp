import { RoundLogoAppImage } from '@assets/images';
import { useAuth } from '@contexts';
import { AuthenticationStack, RootStackParamList, UnauthorizedStack } from '@navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Block, Colors } from '@UIKit';
import React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigation: React.FC = () => {
  const { isVerified, isLoading } = useAuth();

  // Показываем индикатор загрузки пока проверяем статус
  if (isLoading) {
    return (
      <Block flex={1} backgroundColor={Colors.black} justifyContent="center" alignItems="center">
        <Logo source={RoundLogoAppImage} />
      </Block>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isVerified ? (
        <Stack.Screen name={EScreens.UN_AUTHORIZATION_STACK} component={UnauthorizedStack} />
      ) : (
        <Stack.Screen name={EScreens.AUTHORIZATION_STACK} component={AuthenticationStack} />
      )}
    </Stack.Navigator>
  );
};

const Logo = styled(Image)({
  width: 250,
  height: 250,
});
