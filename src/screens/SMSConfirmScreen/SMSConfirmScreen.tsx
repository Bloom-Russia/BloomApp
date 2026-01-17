import { RoundLogoAppImage } from '@assets/images';
import { useAuth } from '@contexts';
import { EScreens, UnAuthStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientService } from '@services';
import {
  Block,
  Button,
  CodeFieldComponent,
  Colors,
  ESpacings,
  ICodeFieldComponent,
  ResendCodeButton,
  Row,
  ScreenContainer,
  Typography,
} from '@UIKit';
import React, { memo, useCallback, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Image } from 'react-native';
import styled from 'styled-components';

const CELL_COUNT = 4;

type SmsConfirmScreenProps = NativeStackScreenProps<
  UnAuthStackParamList,
  EScreens.SMS_CONFIRM_SCREEN
>;

const SmsConfirmScreenComponent: React.FC<SmsConfirmScreenProps> = ({ navigation, route }) => {
  const { phone } = route.params;
  const codeRef = useRef<ICodeFieldComponent>(null);
  const [code, setCode] = useState<string>('');
  const [startTime, setStartTime] = useState(Date.now());
  const { setIsVerified } = useAuth();

  const verifyCodeHandler = useCallback(
    async (inputCode: string) => {
      setCode(inputCode);
      if (inputCode.length === CELL_COUNT) {
        await ApiClientService.verifyCode({
          phone,
          code: inputCode,
          setIsVerified,
        });
      }
    },
    [phone, setIsVerified],
  );

  //Повторная отправка кода
  const resendCode = useCallback(async () => {
    setStartTime(Date.now());
    codeRef.current?.clear();
    await ApiClientService.resendCode({ phone });
  }, [phone]);

  const handleChangePhone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ScreenContainer title={'Авторизация'} paddingHorizontal={ESpacings.s16}>
      <Block flex={1} backgroundColor={Colors.black} justifyContent={'center'}>
        <Row justifyContent="center">
          <Logo source={RoundLogoAppImage} />
        </Row>
        <Typography.B14 marginBottom={ESpacings.s32} color={Colors.white} textAlign={'center'}>
          Введите код из пуш уведомления
        </Typography.B14>
        <CodeFieldComponent
          errorResponse={false}
          value={code}
          setValue={verifyCodeHandler}
          ref={codeRef}
        />
        <ResendCodeButton
          loading={false}
          startTimeInMillis={startTime}
          timeout={10}
          resendCode={resendCode}
        />

        <Button
          marginTop={ESpacings.s32}
          marginBottom={ESpacings.s32}
          title={'Изменить номер телефона'}
          onPress={handleChangePhone}
          color={Colors.white}
          textColor={Colors.black}
        />
      </Block>
    </ScreenContainer>
  );
};

export const SmsConfirmScreen = memo(SmsConfirmScreenComponent, isEqual);

const Logo = styled(Image)({
  width: 100,
  height: 100,
  marginBottom: 60,
});
