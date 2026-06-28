import { RoundLogoAppImage } from '@assets/images';
import { useAuth } from '@contexts';
import { useErrorWithTimeout } from '@hooks';
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
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Image } from 'react-native';
import Config from 'react-native-config';
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

  const { setErrorMessageWithTimeout, cleanupErrors, AlertComponent } = useErrorWithTimeout();

  useEffect(() => cleanupErrors, [cleanupErrors]);

  const verifyCodeHandler = useCallback(
    async (inputCode: string) => {
      setCode(inputCode);
      if (inputCode.length === CELL_COUNT) {
        await ApiClientService.verifyCode({
          params: {
            phone,
            code: inputCode,
            setIsVerified,
          },
          options: {
            errorCodeCallBack: setErrorMessageWithTimeout,
          },
        });
      }
    },
    [phone, setErrorMessageWithTimeout, setIsVerified],
  );

  const resendCode = useCallback(async () => {
    setStartTime(Date.now());
    codeRef.current?.clear();
    await ApiClientService.resendCode({
      phoneNumber: phone,
      options: {
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });
  }, [phone, setErrorMessageWithTimeout]);

  const handleChangePhone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ScreenContainer hideBackIcon title="Ввод кода" paddingHorizontal={ESpacings.s16}>
      <Block flex={1} justifyContent="center">
        <Row justifyContent="center">
          <Logo source={RoundLogoAppImage} />
        </Row>
        <Typography.B14 marginBottom={ESpacings.s32} color={Colors.white} textAlign="center">
          Введите код из пуш уведомления
        </Typography.B14>
        <Block marginBottom={ESpacings.s16}>
          <CodeFieldComponent
            errorResponse={false}
            value={code}
            setValue={verifyCodeHandler}
            ref={codeRef}
          />
        </Block>
        <ResendCodeButton
          loading={false}
          startTimeInMillis={startTime}
          timeout={Number(Config.RESEND_TIMEOUT)}
          resendCode={resendCode}
        />

        <Button
          marginTop={ESpacings.s32}
          marginBottom={ESpacings.s32}
          title="Изменить номер телефона"
          onPress={handleChangePhone}
          color={Colors.white}
          textColor={Colors.black}
        />
      </Block>
      <AlertComponent />
    </ScreenContainer>
  );
};

export const SmsConfirmScreen = memo(SmsConfirmScreenComponent, isEqual);

const Logo = styled(Image)({
  width: 100,
  height: 100,
  marginBottom: 60,
});
