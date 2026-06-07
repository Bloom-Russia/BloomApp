import { RoundLogoAppImage } from '@assets/images';
import { useCustomAlert } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import { Block, Colors, ESpacings, IconNames, Row, ScreenContainer, Typography } from '@UIKit';
import { vibrate, VIBRATION_DURATION } from '@utils';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { AppState, AppStateStatus, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import Config from 'react-native-config';

import {
  ExitButton,
  KeyboardContainer,
  KeyboardRow,
  KeyButton,
  ResetButton,
  StyledDots,
  StyledImage,
} from './components';
import {
  useGetActionButton,
  useHandleExitApp,
  useHandleResetPin,
  useLoadPinCodeData,
} from './hooks';
import { useTitle } from './hooks/useTitle';
import { PinMode } from './types';

const PinCodeScreenComponent: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(({ navigation }) => {
  const [pinMode, setPinMode] = useState<PinMode>(PinMode.SET);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [isPinCodeSet, setIsPinCodeSet] = useState<boolean>(false);
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(false);
  const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(false);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const biometrics = useRef<ReactNativeBiometrics | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticatingRef = useRef<boolean>(false);
  const hasInitialAuthRef = useRef<boolean>(false);

  const { AlertComponent, showAlert, hideAlert } = useCustomAlert();
  const { loadPinCodeData } = useLoadPinCodeData({ setIsPinCodeSet, setPinMode });
  const { handleExitApp } = useHandleExitApp(showAlert);
  const { handleResetPin } = useHandleResetPin({
    clearErrorMessage: () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      hideAlert();
    },
    showAlert,
  });

  const setErrorMessageWithTimeout = useCallback(
    (message: string) => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      showAlert({
        title: message,
        type: 'error',
        theme: 'dark',
        showIcon: true,
        buttons: [
          {
            text: 'Закрыть',
            style: 'destructive',
            showButtonIcon: true,
            buttonIconName: IconNames.cancel,
          },
        ],
      });

      errorTimeoutRef.current = setTimeout(() => {
        hideAlert();
        errorTimeoutRef.current = null;
      }, Number(Config.ERROR_TIMEOUT));
    },
    [hideAlert, showAlert],
  );

  // Инициализация биометрии
  const initBiometrics = useCallback(async () => {
    try {
      biometrics.current = new ReactNativeBiometrics();
      const { available, biometryType } = await biometrics.current.isSensorAvailable();

      setIsBiometricsSupported(available);

      if (Platform.OS === 'ios' && available) {
        // Проверяем существование ключей
        const { keysExist } = await biometrics.current.biometricKeysExist();
        console.log('Biometrics available:', available, biometryType, 'keys exist:', keysExist);
      }

      return available;
    } catch (error) {
      console.error('Error initializing biometrics:', error);
      setIsBiometricsSupported(false);
      return false;
    }
  }, []);

  // Загрузка статуса биометрии
  const loadBiometricsStatus = useCallback(async () => {
    try {
      const { success, data } = await SecureStorageService.getValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
      );
      if (success && data === 'true') {
        setIsBiometricsEnabled(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса биометрии:', error);
    }
  }, []);

  // Сохранение статуса биометрии
  const saveBiometricsStatus = useCallback(async (enabled: boolean) => {
    try {
      await SecureStorageService.saveValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false',
      );
      setIsBiometricsEnabled(enabled);
    } catch (error) {
      console.error('Ошибка сохранения статуса биометрии:', error);
    }
  }, []);

  // Аутентификация по биометрии с защитой от двойного вызова
  const authenticateWithBiometrics = useCallback(async () => {
    // Проверяем все условия для предотвращения повторных вызовов
    if (
      !isBiometricsEnabled ||
      !isBiometricsSupported ||
      isProcessing ||
      isAuthenticatingRef.current ||
      hasAuthenticated
    ) {
      return false;
    }

    // Устанавливаем флаги блокировки
    isAuthenticatingRef.current = true;
    setIsProcessing(true);

    try {
      if (!biometrics.current) {
        await initBiometrics();
        if (!biometrics.current) {
          return false;
        }
      }

      // Проверяем доступность еще раз перед аутентификацией
      const { available } = await biometrics.current.isSensorAvailable();

      if (!available) {
        console.log('Biometrics not available');
        await saveBiometricsStatus(false);
        return false;
      }

      // Для iOS нужно убедиться, что ключи существуют
      if (Platform.OS === 'ios') {
        const { keysExist } = await biometrics.current.biometricKeysExist();
        if (!keysExist) {
          await saveBiometricsStatus(false);
          return false;
        }
      }

      const { success, error } = await biometrics.current.simplePrompt({
        promptMessage:
          Platform.OS === 'ios'
            ? 'Подтвердите вход с помощью Face ID'
            : 'Подтвердите вход с помощью отпечатка пальца',
        cancelButtonText: 'Отмена',
      });

      if (success) {
        // Получаем номер телефона и выполняем вход
        const { success: phoneSuccess, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );

        if (phoneSuccess && phoneNumber) {
          //await ApiClientService.loginWithBiometrics({ phoneNumber });
          setHasAuthenticated(true);
          navigation.replace(EScreens.TABS_STACK);
          return true;
        }
      } else if (error) {
        console.log('Biometric authentication failed:', error);
      }
      return false;
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return false;
    } finally {
      isAuthenticatingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    isBiometricsEnabled,
    isBiometricsSupported,
    isProcessing,
    hasAuthenticated,
    initBiometrics,
    saveBiometricsStatus,
    navigation,
  ]);

  // Сохранение биометрических ключей
  const saveBiometricKeys = useCallback(async () => {
    if (!biometrics.current) {
      await initBiometrics();
      if (!biometrics.current) {
        return false;
      }
    }

    try {
      const { available } = await biometrics.current.isSensorAvailable();

      if (!available) {
        console.log('Biometrics not available for saving');
        return false;
      }

      // Проверяем, существуют ли уже ключи
      const { keysExist } = await biometrics.current.biometricKeysExist();

      let publicKey;
      if (keysExist) {
        const { publicKey: newKey } = await biometrics.current.createKeys();
        publicKey = newKey;
      } else {
        const { publicKey: newKey } = await biometrics.current.createKeys();
        publicKey = newKey;
      }

      // Сохраняем публичный ключ на сервере
      const { success, data: phoneNumber } = await SecureStorageService.getValue(
        SecureStorageKeys.PHONE_NUMBER,
      );

      if (success && phoneNumber && publicKey) {
        // await ApiClientService.saveBiometricKey({
        //   phoneNumber,
        //   publicKey,
        // });
        await saveBiometricsStatus(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving biometric keys:', error);
      return false;
    }
  }, [initBiometrics, saveBiometricsStatus]);

  // Удаление биометрических ключей
  const deleteBiometricKeys = useCallback(async () => {
    if (!biometrics.current) {
      return;
    }

    try {
      await biometrics.current.deleteKeys();
      await saveBiometricsStatus(false);
    } catch (error) {
      console.error('Error deleting biometric keys:', error);
    }
  }, [saveBiometricsStatus]);

  const onPressBiometricsButton = useCallback(async () => {
    if (!biometrics.current) {
      await initBiometrics();
      if (!biometrics.current) {
        navigation.navigate(EScreens.TABS_STACK);
        return;
      }
    }

    try {
      const biometricName = Platform.OS === 'ios' ? 'Face ID' : 'Touch ID';

      showAlert({
        title: 'Использовать биометрию для входа?',
        message: `Использовать ${biometricName} для входа`,
        type: 'info',
        theme: 'dark',
        showIcon: true,
        buttons: [
          {
            text: 'Позже',
            style: 'cancel',
            showButtonIcon: true,
            buttonIconName: IconNames.cancel,
            onPress: async () => {
              await saveBiometricsStatus(false);
            },
          },
          {
            text: 'Да',
            style: 'default',
            showButtonIcon: true,
            buttonIconName: Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint,
            onPress: async () => {
              const success = await saveBiometricKeys();
              if (success) {
                //navigation.navigate(EScreens.TABS_STACK);
              } else {
                setErrorMessageWithTimeout('Не удалось настроить биометрию');
              }
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error in onPressBiometricsButton:', error);
    }
  }, [
    initBiometrics,
    navigation,
    saveBiometricKeys,
    saveBiometricsStatus,
    setErrorMessageWithTimeout,
    showAlert,
  ]);

  // Запрос на использование биометрии
  const requestForTheUseOfBiometrics = useCallback(async () => {
    if (!biometrics.current) {
      await initBiometrics();
      if (!biometrics.current) {
        navigation.navigate(EScreens.TABS_STACK);
        return;
      }
    }

    try {
      const { available, biometryType } = await biometrics.current.isSensorAvailable();

      if (!available) {
        navigation.navigate(EScreens.TABS_STACK);
        return;
      }

      const isFaceId = biometryType === 'FaceID';
      const biometricName = isFaceId ? 'Face ID' : 'Touch ID';

      showAlert({
        title: 'Использовать биометрию для входа?',
        message: `Использовать ${biometricName} для входа`,
        type: 'info',
        theme: 'dark',
        showIcon: true,
        buttons: [
          {
            text: 'Позже',
            style: 'cancel',
            showButtonIcon: true,
            buttonIconName: IconNames.cancel,
            onPress: async () => {
              await saveBiometricsStatus(false);
              navigation.navigate(EScreens.TABS_STACK);
            },
          },
          {
            text: 'Да',
            style: 'default',
            showButtonIcon: true,
            buttonIconName: isFaceId ? IconNames.faceId : IconNames.fingerprint,
            onPress: async () => {
              const success = await saveBiometricKeys();
              if (success) {
                navigation.navigate(EScreens.TABS_STACK);
              } else {
                setErrorMessageWithTimeout('Не удалось настроить биометрию');
              }
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error in requestForTheUseOfBiometrics:', error);
    }
  }, [
    initBiometrics,
    navigation,
    showAlert,
    saveBiometricsStatus,
    saveBiometricKeys,
    setErrorMessageWithTimeout,
  ]);

  // Автоматический вход по биометрии - только один раз
  useEffect(() => {
    let isMounted = true;

    const attemptBiometricAuth = async () => {
      // Проверяем, не была ли уже выполнена аутентификация
      if (
        !isMounted ||
        hasInitialAuthRef.current ||
        hasAuthenticated ||
        !isPinCodeSet ||
        !isBiometricsEnabled ||
        !isBiometricsSupported
      ) {
        return;
      }

      hasInitialAuthRef.current = true;

      const success = await authenticateWithBiometrics();

      if (!success && isMounted) {
        setPinMode(PinMode.ENTER);
      }
    };

    // Небольшая задержка для iOS
    const timer = setTimeout(() => {
      attemptBiometricAuth().then(() => noop);
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isPinCodeSet,
    isBiometricsEnabled,
    isBiometricsSupported,
    hasAuthenticated,
    authenticateWithBiometrics,
  ]);

  // Отслеживание состояния приложения для повторной аутентификации
  useEffect(() => {
    let isMounted = true;
    let lastAuthTime = 0;
    const AUTH_COOLDOWN = 2000; // Кулдаун 2 секунды

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const now = Date.now();

      if (
        nextAppState === 'active' &&
        appStateRef.current !== 'active' &&
        isPinCodeSet &&
        isBiometricsEnabled &&
        isBiometricsSupported &&
        pinMode === PinMode.ENTER &&
        !hasAuthenticated &&
        !isAuthenticatingRef.current &&
        now - lastAuthTime > AUTH_COOLDOWN
      ) {
        lastAuthTime = now;
        // При возвращении в приложение запрашиваем биометрию снова
        setTimeout(() => {
          if (isMounted && !hasAuthenticated) {
            authenticateWithBiometrics();
          }
        }, 300);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [
    isPinCodeSet,
    isBiometricsEnabled,
    isBiometricsSupported,
    pinMode,
    hasAuthenticated,
    authenticateWithBiometrics,
  ]);

  const errorVerifyPinCodeCallBack = useCallback(() => {
    setErrorMessageWithTimeout('Ошибка верификации PIN кода!');
  }, [setErrorMessageWithTimeout]);

  const handleEnterPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      try {
        const { success, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );
        if (!success || !phoneNumber) {
          setErrorMessageWithTimeout('Номер телефона не найден!');
          setCurrentPin('');
          return;
        }

        await ApiClientService.verifyPinCode({
          phoneNumber,
          pinCode: pin,
          errorVerifyPinCodeCallBack,
        });

        setCurrentPin('');
        setConfirmPin('');
        setIsPinCodeSet(true);
      } catch (error) {
        console.error('Ошибка верификации PIN:', error);
        setErrorMessageWithTimeout('Неверный PIN-код');
        setCurrentPin('');
        vibrate(VIBRATION_DURATION.ERROR);
      } finally {
        setIsProcessing(false);
      }
    },
    [errorVerifyPinCodeCallBack, setErrorMessageWithTimeout],
  );

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      try {
        const { success, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );
        if (!success || !phoneNumber) {
          setErrorMessageWithTimeout('Номер телефона не найден!');
          return;
        }

        await ApiClientService.savePinCode({
          phoneNumber,
          pinCode: pin,
        });

        setCurrentPin('');
        setConfirmPin('');
        setIsPinCodeSet(true);

        // Запрашиваем использование биометрии после успешной установки PIN
        await requestForTheUseOfBiometrics();
      } catch (error) {
        console.error('Ошибка сохранения PIN:', error);
        setErrorMessageWithTimeout('Ошибка сохранения PIN-кода');
        setCurrentPin('');
        setConfirmPin('');
        setPinMode(PinMode.SET);
      } finally {
        setIsProcessing(false);
      }
    },
    [requestForTheUseOfBiometrics, setErrorMessageWithTimeout],
  );

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (isProcessing) {
        return;
      }

      try {
        switch (pinMode) {
          case PinMode.SET:
            setConfirmPin(pin);
            setPinMode(PinMode.CONFIRM);
            setCurrentPin('');
            break;

          case PinMode.CONFIRM:
            if (pin === confirmPin) {
              await handleConfirmPin(pin);
            } else {
              setErrorMessageWithTimeout('PIN-коды не совпадают');
              vibrate(VIBRATION_DURATION.ERROR);
              setPinMode(PinMode.SET);
              setCurrentPin('');
              setConfirmPin('');
            }
            break;

          case PinMode.ENTER:
            if (pin.length === 4) {
              await handleEnterPin(pin);
            }
            break;
        }
      } catch (error) {
        console.error('Ошибка обработки PIN:', error);
        setErrorMessageWithTimeout('Ошибка обработки PIN-кода');
        setCurrentPin('');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      pinMode,
      confirmPin,
      handleEnterPin,
      handleConfirmPin,
      setErrorMessageWithTimeout,
      isProcessing,
    ],
  );

  const handleDeletePress = useCallback((): void => {
    if (isProcessing) {
      return;
    }
    vibrate(VIBRATION_DURATION.SHORT);
    if (currentPin.length > 0) {
      setCurrentPin((prev) => prev.slice(0, -1));
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      hideAlert();
    }
  }, [currentPin, isProcessing, hideAlert]);

  const handleNumberPress = useCallback(
    (number: string) => {
      if (isProcessing) {
        return;
      }
      if (currentPin.length < 4) {
        const newPin = currentPin + number;
        setCurrentPin(newPin);
        vibrate(VIBRATION_DURATION.SHORT);

        if (newPin.length === 4) {
          setTimeout(async () => {
            await handlePinComplete(newPin);
          }, 100);
        }
      }
    },
    [currentPin, handlePinComplete, isProcessing],
  );

  const renderPinDots = useCallback(() => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <StyledDots
          key={i}
          backgroundColor={i < currentPin.length ? Colors.white : 'transparent'}
        />,
      );
    }
    return (
      <Row justifyContent="center" marginBottom={ESpacings.s16} gap={ESpacings.s16}>
        {dots}
      </Row>
    );
  }, [currentPin]);

  const { getSubtitle, getTitle } = useTitle(pinMode);
  const { getActionButton } = useGetActionButton({
    handleDeletePress,
    hasEnteredSymbols: currentPin.length > 0,
    isPinCodeSet,
    onPressBiometricsButton,
  });

  // Инициализация
  useEffect(() => {
    const initialize = async () => {
      await initBiometrics();
      await loadPinCodeData();
      await loadBiometricsStatus();
    };
    initialize().then(() => noop);
  }, [initBiometrics, loadPinCodeData, loadBiometricsStatus]);

  // Очистка
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const handleReset = useCallback(async () => {
    if (isProcessing) {
      return;
    }
    handleResetPin();
    await deleteBiometricKeys();
    setPinMode(PinMode.SET);
    setIsPinCodeSet(false);
    setCurrentPin('');
    setConfirmPin('');
    setIsProcessing(false);
    setHasAuthenticated(false);
    hasInitialAuthRef.current = false;
    isAuthenticatingRef.current = false;
  }, [handleResetPin, isProcessing, deleteBiometricKeys]);

  return (
    <ScreenContainer scrollEnabled={false}>
      <Block flex={1}>
        <Block alignItems="center" marginTop={ESpacings.s4} marginBottom={ESpacings.s16}>
          <StyledImage source={RoundLogoAppImage} />
        </Block>

        <Block flex={1} padding={ESpacings.s16} alignItems="center" justifyContent="center">
          <Block alignItems="center" marginBottom={ESpacings.s16}>
            <Typography.B16 color={Colors.white} textAlign="center" marginBottom={ESpacings.s8}>
              {getTitle()}
            </Typography.B16>
            <Typography.R14 color={Colors.textSecondary} textAlign="center">
              {getSubtitle()}
            </Typography.R14>
          </Block>

          {renderPinDots()}

          {isPinCodeSet && pinMode !== PinMode.ENTER && (
            <ResetButton onPress={handleReset}>
              <Typography.B14 color={Colors.primary}>Забыли PIN?</Typography.B14>
            </ResetButton>
          )}
        </Block>
      </Block>

      <KeyboardContainer>
        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'1'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'2'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'3'} isLocked={isProcessing} />
        </KeyboardRow>

        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'4'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'5'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'6'} isLocked={isProcessing} />
        </KeyboardRow>

        <KeyboardRow>
          <KeyButton onPress={handleNumberPress} number={'7'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'8'} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'9'} isLocked={isProcessing} />
        </KeyboardRow>

        <KeyboardRow>
          <ExitButton handleExitApp={handleExitApp} isLocked={isProcessing} />
          <KeyButton onPress={handleNumberPress} number={'0'} isLocked={isProcessing} />
          {getActionButton()}
        </KeyboardRow>
      </KeyboardContainer>

      <AlertComponent />
    </ScreenContainer>
  );
});

export const PinCodeScreen = memo(PinCodeScreenComponent, isEqual);
