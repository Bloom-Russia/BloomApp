import { EScreens, UnAuthStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { Text, View } from 'react-native';

type LoginScreenProps = NativeStackScreenProps<UnAuthStackParamList, typeof EScreens.LOGIN_SCREEN>;

const LoginScreenComponent: React.FC<LoginScreenProps> = observer(() => {
  // const { authStore } = useStores();
  // const { t } = useTranslation();
  //
  // const {
  //   control,
  //   handleSubmit,
  //   setValue,
  //   formState: { errors, isValid },
  // } = useAppForm<LoginFormValues>({
  //   schema: loginSchema,
  //   defaultValues: { phone: '' },
  //   mode: 'onChange',
  // });
  //
  // const handlePhoneChange = useCallback(
  //   (value: string) => {
  //     authStore.setPhoneNumber(value);
  //     setValue('phone', value, { shouldValidate: true });
  //
  //     if (value.length >= CONSTANTS.MIN_PHONE_LENGTH) {
  //       Keyboard.dismiss();
  //     }
  //   },
  //   [authStore, setValue],
  // );
  //
  // const onSubmit = useCallback(
  //   async (data: LoginFormValues) => {
  //     const success = await authStore.requestVerificationCode(data.phone);
  //
  //     if (success) {
  //       navigation.navigate(EScreens.SMS_CONFIRM_SCREEN, { phone: data.phone });
  //     }
  //   },
  //   [authStore, navigation],
  // );
  //
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
  //   return () => backHandler.remove();
  // }, []);
  //
  // useEffect(() => {
  //   return () => {
  //     authStore.resetState();
  //   };
  // }, [authStore]);
  //
  // const errorMessage = authStore.error ? t(authStore.error) : undefined;

  return (
    <View>
      <Text>{'errorMessage'}</Text>
    </View>
  );

  // return (
  //   <ScreenContainer hideBackIcon title={t('auth.login.title')} paddingHorizontal={ESpacings.s16}>
  //     <Block flex={1} justifyContent="center">
  //       <Row justifyContent="center">
  //         <Logo source={RoundLogoAppImage} />
  //       </Row>
  //
  //       <Controller
  //         control={control}
  //         name="phone"
  //         render={({ field }) => (
  //           <MaskedPhoneInput
  //             phone={field.value}
  //             setPhone={handlePhoneChange}
  //             errorText={errors?.phone?.message}
  //           />
  //         )}
  //       />
  //
  //       {errorMessage && (
  //         <Block marginTop={ESpacings.s8}>
  //           <Typography.B14 color={Colors.error}>{errorMessage}</Typography.B14>
  //         </Block>
  //       )}
  //
  //       <Button
  //         loading={authStore.isLoading}
  //         disabled={!isValid || authStore.isLoading}
  //         paddingTop={140}
  //         title={t('auth.login.requestCode')}
  //         onPress={handleSubmit(onSubmit)}
  //         color={Colors.blue}
  //       />
  //     </Block>
  //   </ScreenContainer>
  // );
});

export const LoginScreen = memo(LoginScreenComponent, isEqual);

// const Logo = styled(Image)({
//   width: 100,
//   height: 100,
//   marginBottom: 60,
// });
