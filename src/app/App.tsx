// src/app/App.tsx
import { TransparentLogoAppImage } from '@assets/images';
import { Block, Button, MaskedPhoneInput, ScreenContainer, Typography } from '@components';
import { container } from '@core/di';
import { Colors } from '@core/styles';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Alert, Image } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [phone, setPhone] = useState('');
  const rootStore = container.getRootStore();
  const { authStore } = rootStore;

  useEffect(() => {
    const init = async () => {
      try {
        await rootStore.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Init error:', error);
        setIsReady(true);
      } finally {
        await RNBootSplash.hide({ fade: true });
      }
    };
    init();
  }, [rootStore]);

  const handleGetCode = async () => {
    if (phone.length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    const success = await authStore.requestVerificationCode(phone);

    if (success) {
      Alert.alert('Успех', 'Код подтверждения отправлен!');
      console.log('Code sent to:', phone);
    } else {
      Alert.alert('Ошибка', authStore.error || 'Не удалось отправить код');
    }
  };

  if (!isReady) {
    return (
      <Block flex={1} justifyContent="center" alignItems="center" backgroundColor={Colors.black}>
        <Image source={TransparentLogoAppImage} style={{ width: 200, height: 200 }} />
      </Block>
    );
  }

  return (
    <ScreenContainer title="Bloom App">
      <Block flex={1} justifyContent="center" paddingHorizontal={20}>
        <Image
          source={TransparentLogoAppImage}
          style={{ width: 200, height: 200, alignSelf: 'center' }}
        />
        <Typography.B16 color={Colors.white} marginTop={20} textAlign="center">
          Добро пожаловать!
        </Typography.B16>
        <Typography.B16 color={Colors.textSecondary} marginTop={8} textAlign="center">
          Введите номер телефона для входа
        </Typography.B16>
        <MaskedPhoneInput title="Номер телефона" phone={phone} setPhone={setPhone} />
        <Button
          title={authStore.isLoading ? 'Отправка...' : 'Получить код'}
          onPress={handleGetCode}
          color={Colors.blue}
          textColor={Colors.white}
          disabled={authStore.isLoading}
          marginTop={20}
        />
        {authStore.error && (
          <Typography.B16 color={Colors.error} marginTop={12} textAlign="center">
            {authStore.error}
          </Typography.B16>
        )}
      </Block>
    </ScreenContainer>
  );
};

export default observer(App);
