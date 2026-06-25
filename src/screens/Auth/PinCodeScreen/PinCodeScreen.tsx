import { RoundLogoAppImage } from '@assets/images';
import { useErrorWithTimeout, useHandleExitApp } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import {
  AbsoluteSpinner,
  Block,
  Colors,
  ESpacings,
  IconNames,
  Row,
  ScreenContainer,
  Typography,
} from '@UIKit';
import { vibrate, VIBRATION_DURATION } from '@utils';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { AppState, AppStateStatus, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

import {
  ExitButton,
  KeyboardContainer,
  KeyboardRow,
  KeyButton,
  StyledDots,
  StyledImage,
} from './components';
import { useGetActionButton, useLoadPinCodeData, useTitle } from './hooks';
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
  const [loading, setLoading] = useState<boolean>(false);

  const biometrics = useRef<ReactNativeBiometrics | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticatingRef = useRef<boolean>(false);
  const hasInitialAuthRef = useRef<boolean>(false);

  const { setErrorMessageWithTimeout, hideError, cleanupErrors, AlertComponent, showAlert } =
    useErrorWithTimeout();

  const { loadPinCodeData } = useLoadPinCodeData({
    setIsPinCodeSet,
    setPinMode,
    setLoading,
  });

  const { handleExitApp } = useHandleExitApp(showAlert, setLoading);

  // Функция для проверки статуса онбординга и навигации
  const checkAndNavigateAfterAuth = useCallback(async () => {
    try {
      const { success, data: onboardingCompleted } = await SecureStorageService.getValue(
        SecureStorageKeys.ONBOARDING_COMPLETED,
      );

      const isOnboardingCompleted = success && !!onboardingCompleted;

      if (isOnboardingCompleted) {
        navigation.replace(EScreens.TABS_STACK);
      } else {
        navigation.replace(EScreens.ON_BOARDING_SCREEN);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса онбординга:', error);
      navigation.replace(EScreens.ON_BOARDING_SCREEN);
    }
  }, [navigation]);

  // Инициализация биометрии
  const initBiometrics = useCallback(async () => {
    try {
      biometrics.current = new ReactNativeBiometrics();
      const { available } = await biometrics.current.isSensorAvailable();
      setIsBiometricsSupported(available);
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
      const { success: setupSuccess, data: setupCompleted } = await SecureStorageService.getValue(
        SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED,
      );

      if (!setupSuccess || setupCompleted !== 'true') {
        setIsBiometricsEnabled(false);
        return false;
      }

      const { success, data } = await SecureStorageService.getValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
      );
      const enabled = success && data === 'true';
      setIsBiometricsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Ошибка загрузки статуса биометрии:', error);
      setIsBiometricsEnabled(false);
      return false;
    }
  }, []);

  // Сохранение статуса биометрии
  const saveBiometricsStatus = useCallback(async (enabled: boolean) => {
    try {
      await SecureStorageService.saveValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false',
      );

      if (enabled) {
        await SecureStorageService.saveValue(SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED, 'true');
      }

      setIsBiometricsEnabled(enabled);
      console.log('🔐 Статус биометрии сохранен:', { enabled, setupCompleted: enabled });
    } catch (error) {
      console.error('Ошибка сохранения статуса биометрии:', error);
    }
  }, []);

  // Сброс статуса биометрии
  const resetBiometricsStatus = useCallback(async () => {
    try {
      await SecureStorageService.saveValue(SecureStorageKeys.BIOMETRIC_ENABLED, 'false');
      await SecureStorageService.saveValue(SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED, 'false');
      setIsBiometricsEnabled(false);
      console.log('🔐 Статус биометрии сброшен');
    } catch (error) {
      console.error('Ошибка сброса статуса биометрии:', error);
    }
  }, []);

  // Сброс некорректного статуса биометрии при монтировании
  useEffect(() => {
    const checkAndResetInvalidBiometricsStatus = async () => {
      if (!biometrics.current) {
        await initBiometrics();
      }

      if (biometrics.current) {
        try {
          const { keysExist } = await biometrics.current.biometricKeysExist();
          const { data: setupCompleted } = await SecureStorageService.getValue(
            SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED,
          );
          const { data: enabled } = await SecureStorageService.getValue(
            SecureStorageKeys.BIOMETRIC_ENABLED,
          );

          if (!keysExist && (setupCompleted === 'true' || enabled === 'true')) {
            await resetBiometricsStatus();
          }
        } catch (error) {
          console.error('Ошибка проверки статуса биометрии:', error);
        }
      }
    };

    checkAndResetInvalidBiometricsStatus().then(() => noop);
  }, [initBiometrics, resetBiometricsStatus]);

  // Аутентификация по биометрии с защитой от двойного вызова
  const authenticateWithBiometrics = useCallback(async () => {
    if (
      !isBiometricsEnabled ||
      !isBiometricsSupported ||
      isProcessing ||
      isAuthenticatingRef.current ||
      hasAuthenticated
    ) {
      return false;
    }

    isAuthenticatingRef.current = true;
    setIsProcessing(true);

    if (!biometrics.current) {
      const initialized = await initBiometrics();
      if (!initialized || !biometrics.current) {
        return false;
      }
    }
    setLoading(true);
    const { available } = await biometrics.current.isSensorAvailable();

    if (!available) {
      await resetBiometricsStatus();
      setLoading(false);
      return false;
    }

    if (Platform.OS === 'ios') {
      const { keysExist } = await biometrics.current.biometricKeysExist();
      if (!keysExist) {
        await resetBiometricsStatus();
        setLoading(false);
        return false;
      }
    }

    const biometricName = Platform.OS === 'ios' ? 'Face ID' : 'Touch ID';
    const { success, error } = await biometrics.current.simplePrompt({
      promptMessage: `Подтвердите вход с помощью ${biometricName}`,
      cancelButtonText: 'Отмена',
    });

    if (success) {
      await ApiClientService.loginWithBiometrics({
        options: {
          changeLoading: setLoading,
          errorCodeCallBack: setErrorMessageWithTimeout,
        },
      });
      setHasAuthenticated(true);
      await checkAndNavigateAfterAuth();
    } else {
      console.error('❌ Ошибка при биометрической аутентификации:', error);
    }

    isAuthenticatingRef.current = false;
    setIsProcessing(false);
    return success;
  }, [
    isBiometricsEnabled,
    isBiometricsSupported,
    isProcessing,
    hasAuthenticated,
    initBiometrics,
    resetBiometricsStatus,
    setErrorMessageWithTimeout,
    checkAndNavigateAfterAuth,
  ]);

  // Сохранение биометрических ключей
  const saveBiometricKeys = useCallback(async () => {
    if (!biometrics.current) {
      const initialized = await initBiometrics();
      if (!initialized || !biometrics.current) {
        return false;
      }
    }

    setLoading(true);
    const { available } = await biometrics.current.isSensorAvailable();

    if (!available) {
      setLoading(false);
      return false;
    }

    const { publicKey } = await biometrics.current.createKeys();
    const { success } = await ApiClientService.saveBiometricKey({
      params: {
        publicKey,
      },
      options: {
        changeLoading: setLoading,
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });

    if (success) {
      await saveBiometricsStatus(true);
      return true;
    }

    console.error('❌ Ошибка сохранения биометрических ключей:');
    return false;
  }, [initBiometrics, saveBiometricsStatus, setErrorMessageWithTimeout]);

  // Функция для настройки биометрии
  const setupBiometrics = useCallback(
    async (shouldNavigateOnCancel: boolean = true) => {
      // Если биометрия уже настроена - показываем аутентификацию
      if (isBiometricsEnabled) {
        const success = await authenticateWithBiometrics();
        if (!success && shouldNavigateOnCancel) {
          await checkAndNavigateAfterAuth();
        }
        return;
      }

      if (!biometrics.current) {
        const initialized = await initBiometrics();
        if (!initialized || !biometrics.current) {
          if (shouldNavigateOnCancel) {
            await checkAndNavigateAfterAuth();
          }
          return;
        }
      }

      try {
        const { available, biometryType } = await biometrics.current.isSensorAvailable();

        if (!available) {
          if (shouldNavigateOnCancel) {
            await checkAndNavigateAfterAuth();
          }
          return;
        }

        const isFaceId = biometryType === 'FaceID';
        const biometricName = isFaceId ? 'Face ID' : 'Touch ID';

        showAlert({
          title: 'Использовать биометрию для входа?',
          message: `Использовать ${biometricName} для быстрого и безопасного входа в приложение?`,
          type: 'question',
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
                if (shouldNavigateOnCancel) {
                  await checkAndNavigateAfterAuth();
                }
              },
            },
            {
              text: 'Да',
              style: 'default',
              showButtonIcon: true,
              buttonIconName: isFaceId ? IconNames.faceId : IconNames.fingerprint,
              onPress: async () => {
                if (!biometrics.current) {
                  setErrorMessageWithTimeout('Биометрия недоступна');
                  return;
                }

                try {
                  const authResult = await biometrics.current.simplePrompt({
                    promptMessage: `Подтвердите использование ${biometricName}`,
                    cancelButtonText: 'Отмена',
                  });

                  if (authResult.success) {
                    const success = await saveBiometricKeys();
                    if (success) {
                      setHasAuthenticated(true);
                      await checkAndNavigateAfterAuth();
                    } else {
                      console.error('Не удалось настроить биометрию');
                      if (shouldNavigateOnCancel) {
                        await checkAndNavigateAfterAuth();
                      }
                    }
                  } else {
                    console.error('Настройка биометрии отменена');
                    if (shouldNavigateOnCancel) {
                      await checkAndNavigateAfterAuth();
                    }
                  }
                } catch {
                  console.error('Произошла ошибка при настройке биометрии');
                }
              },
            },
          ],
        });
      } catch (error) {
        console.error('❌ Произошла ошибка при настройке биометрии:', error);
      }
    },
    [
      showAlert,
      isBiometricsEnabled,
      authenticateWithBiometrics,
      checkAndNavigateAfterAuth,
      initBiometrics,
      saveBiometricKeys,
      saveBiometricsStatus,
      setErrorMessageWithTimeout,
      setHasAuthenticated,
    ],
  );

  // Функция для проверки и показа диалога биометрии
  const checkAndShowBiometricsSetup = useCallback(async () => {
    if (!biometrics.current) {
      await initBiometrics();
    }

    let isSupported = isBiometricsSupported;
    if (biometrics.current && !isSupported) {
      const { available } = await biometrics.current.isSensorAvailable();
      isSupported = available;
      if (available !== isBiometricsSupported) {
        setIsBiometricsSupported(available);
      }
    }

    const { success: setupSuccess, data: setupCompleted } = await SecureStorageService.getValue(
      SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED,
    );
    const isSetupCompleted = setupSuccess && setupCompleted === 'true';
    if (isSupported && !isSetupCompleted) {
      // ✅ Показываем диалог настройки биометрии
      await setupBiometrics(true);
    } else {
      // ⏸️ Не показываем диалог биометрии
      await checkAndNavigateAfterAuth();
    }
  }, [isBiometricsSupported, initBiometrics, setupBiometrics, checkAndNavigateAfterAuth]);

  // Автоматический вход по биометрии
  useEffect(() => {
    let isMounted = true;

    const attemptBiometricAuth = async () => {
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

  // Отслеживание состояния приложения
  useEffect(() => {
    let isMounted = true;
    let lastAuthTime = 0;
    const AUTH_COOLDOWN = 2000;

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

  const handleEnterPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      const { success } = await ApiClientService.verifyPinCode({
        params: {
          pinCode: pin,
        },
        options: {
          errorCodeCallBack: setErrorMessageWithTimeout,
          changeLoading: setLoading,
        },
      });

      if (success) {
        setConfirmPin('');
        setIsPinCodeSet(true);
        setHasAuthenticated(true);
        await checkAndNavigateAfterAuth();
      } else {
        console.error('Ошибка верификации PIN');
        vibrate(VIBRATION_DURATION.ERROR);
      }
      setCurrentPin('');
      setIsProcessing(false);
    },
    [checkAndNavigateAfterAuth, setErrorMessageWithTimeout],
  );

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      setIsProcessing(true);
      const { success } = await ApiClientService.savePinCode({
        params: {
          pinCode: pin,
        },
        options: {
          errorCodeCallBack: setErrorMessageWithTimeout,
          changeLoading: setLoading,
        },
      });

      if (success) {
        setIsPinCodeSet(true);
        await checkAndShowBiometricsSetup();
      } else {
        console.error('Ошибка сохранения PIN:');
        setPinMode(PinMode.SET);
      }
      setCurrentPin('');
      setConfirmPin('');
      setIsProcessing(false);
    },
    [checkAndShowBiometricsSetup, setErrorMessageWithTimeout],
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
              vibrate(VIBRATION_DURATION.ERROR);
              setPinMode(PinMode.SET);
              setCurrentPin('');
              setConfirmPin('');
              setErrorMessageWithTimeout('PIN-коды не совпадают');
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
    // Используем hideError вместо прямой работы с errorTimeoutRef
    hideError();
  }, [currentPin, isProcessing, hideError]);

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
    onPressBiometricsButton: () => setupBiometrics(false),
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

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupErrors();
    };
  }, [cleanupErrors]);

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

      {loading ? <AbsoluteSpinner /> : null}
      <AlertComponent />
    </ScreenContainer>
  );
});

export const PinCodeScreen = memo(PinCodeScreenComponent, isEqual);
