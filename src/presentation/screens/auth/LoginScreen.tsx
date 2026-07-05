import { useStores } from '@app/providers/StoreProvider';
import { RoundLogoAppImage } from '@assets/images';
import {
  Block,
  Button,
  MaskedPhoneInput,
  Row,
  ScreenContainer,
  Typography,
} from '@components/common';
import { Colors, ESpacings } from '@core/styles';
import { LoginFormValues, loginSchema } from '@forms';
import { useAppForm, useNotificationPermission } from '@hooks';
import { EScreens, UnAuthStackParamList } from '@navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import React, { memo, useCallback, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BackHandler, Image, Keyboard } from 'react-native';
import styled from 'styled-components';
import { CONSTANTS } from './constants';

type LoginScreenProps = NativeStackScreenProps<UnAuthStackParamList, typeof EScreens.LOGIN_SCREEN>;

const LoginScreenComponent: React.FC<LoginScreenProps> = observer(({ navigation }) => {
  const { authStore } = useStores();
  const { t } = useTranslation();

  useNotificationPermission();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useAppForm<LoginFormValues>({
    schema: loginSchema,
    defaultValues: { phone: '' },
    mode: 'onChange',
  });

  const handlePhoneChange = useCallback(
    (value: string) => {
      authStore.setPhoneNumber(value);
      setValue('phone', value, { shouldValidate: true });

      if (value.length >= CONSTANTS.MIN_PHONE_LENGTH) {
        Keyboard.dismiss();
      }
    },
    [authStore, setValue],
  );

  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      const success = await authStore.requestVerificationCode(data.phone);

      if (success) {
        navigation.navigate(EScreens.SMS_CONFIRM_SCREEN, { phone: data.phone });
      }
    },
    [authStore, navigation],
  );

  useEffect(() => {
    if (authStore.isCodeSent && authStore.phoneNumber) {
      navigation.navigate(EScreens.SMS_CONFIRM_SCREEN, { phone: authStore.phoneNumber });
      authStore.resetCodeSentStatus();
    }
  }, [authStore, authStore.isCodeSent, authStore.phoneNumber, navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    return () => {
      authStore.resetState();
    };
  }, [authStore]);

  const errorMessage = authStore.error ? t(authStore.error) : undefined;

  return (
    <ScreenContainer hideBackIcon title={t('auth.login.title')} paddingHorizontal={ESpacings.s16}>
      <Block flex={1} justifyContent="center">
        <Row justifyContent="center">
          <Logo source={RoundLogoAppImage} />
        </Row>

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <MaskedPhoneInput
              phone={field.value}
              setPhone={handlePhoneChange}
              errorText={errors?.phone?.message}
            />
          )}
        />

        {errorMessage && (
          <Block marginTop={ESpacings.s8}>
            <Typography.B14 color={Colors.error}>{errorMessage}</Typography.B14>
          </Block>
        )}

        <Button
          loading={authStore.isLoading}
          disabled={!isValid || authStore.isLoading}
          paddingTop={140}
          title={t('auth.login.requestCode')}
          onPress={handleSubmit(onSubmit)}
          color={Colors.blue}
        />
      </Block>
    </ScreenContainer>
  );
});

export const LoginScreen = memo(LoginScreenComponent, isEqual);

const Logo = styled(Image)({
  width: 100,
  height: 100,
  marginBottom: 60,
});
