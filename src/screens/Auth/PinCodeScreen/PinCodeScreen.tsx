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
  StyledDots,
  StyledImage,
} from './components';
import { useGetActionButton, useHandleExitApp, useLoadPinCodeData } from './hooks';
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

  // Функция для проверки статуса онбординга и навигации
  const checkAndNavigateAfterAuth = useCallback(async () => {
    try {
      // Проверяем, был ли завершен онбординг
      const { success, data: onboardingCompleted } = await SecureStorageService.getValue(
        SecureStorageKeys.ONBOARDING_COMPLETED,
      );

      const isOnboardingCompleted = success && onboardingCompleted === 'true';

      if (isOnboardingCompleted) {
        // Если онбординг уже пройден, идем сразу в приложение
        navigation.replace(EScreens.TABS_STACK);
      } else {
        // Если нет - показываем онбординг
        navigation.replace(EScreens.ON_BOARDING_SCREEN);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса онбординга:', error);
      // В случае ошибки показываем онбординг для безопасности
      navigation.replace(EScreens.ON_BOARDING_SCREEN);
    }
  }, [navigation]);

  // Инициализация биометрии
  const initBiometrics = useCallback(async () => {
    try {
      biometrics.current = new ReactNativeBiometrics();
      const { available, biometryType } = await biometrics.current.isSensorAvailable();

      console.log('📱 Биометрия инициализирована:', {
        available,
        biometryType,
        platform: Platform.OS,
      });

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
      // Проверяем, был ли завершен процесс настройки биометрии
      const { success: setupSuccess, data: setupCompleted } = await SecureStorageService.getValue(
        SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED,
      );

      // Если настройка не была завершена, считаем биометрию отключенной
      if (!setupSuccess || setupCompleted !== 'true') {
        console.log('🔐 Биометрия еще не была настроена, устанавливаем isBiometricsEnabled=false');
        setIsBiometricsEnabled(false);
        return false;
      }

      // Только если настройка была завершена, проверяем статус
      const { success, data } = await SecureStorageService.getValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
      );
      const enabled = success && data === 'true';
      setIsBiometricsEnabled(enabled);
      console.log('🔐 Статус биометрии загружен:', { enabled, setupCompleted });
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
      // Сохраняем основной статус
      await SecureStorageService.saveValue(
        SecureStorageKeys.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false',
      );

      // Если enabled === true, отмечаем что настройка была завершена
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

          console.log('🔍 Проверка статуса биометрии при монтировании:', {
            keysExist,
            setupCompleted,
            enabled,
          });

          // Если нет ключей, но статус говорит что есть - сбрасываем
          if (!keysExist && (setupCompleted === 'true' || enabled === 'true')) {
            console.log('⚠️ Обнаружен некорректный статус биометрии, сбрасываем...');
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
    // Проверяем все условия для предотвращения повторных вызовов
    if (
      !isBiometricsEnabled ||
      !isBiometricsSupported ||
      isProcessing ||
      isAuthenticatingRef.current ||
      hasAuthenticated
    ) {
      console.log('⏸️ Биометрическая аутентификация пропущена:', {
        isBiometricsEnabled,
        isBiometricsSupported,
        isProcessing,
        isAuthenticating: isAuthenticatingRef.current,
        hasAuthenticated,
      });
      return false;
    }

    // Устанавливаем флаги блокировки
    isAuthenticatingRef.current = true;
    setIsProcessing(true);

    try {
      if (!biometrics.current) {
        const initialized = await initBiometrics();
        if (!initialized || !biometrics.current) {
          return false;
        }
      }

      // Проверяем доступность еще раз перед аутентификацией
      const { available } = await biometrics.current.isSensorAvailable();

      if (!available) {
        console.log('❌ Биометрия недоступна');
        await resetBiometricsStatus();
        return false;
      }

      // Для iOS нужно убедиться, что ключи существуют
      if (Platform.OS === 'ios') {
        const { keysExist } = await biometrics.current.biometricKeysExist();
        if (!keysExist) {
          console.log('❌ Биометрические ключи не найдены');
          await resetBiometricsStatus();
          return false;
        }
      }

      const biometricName = Platform.OS === 'ios' ? 'Face ID' : 'Touch ID';
      const { success, error } = await biometrics.current.simplePrompt({
        promptMessage: `Подтвердите вход с помощью ${biometricName}`,
        cancelButtonText: 'Отмена',
      });

      if (success) {
        // Получаем номер телефона и выполняем вход
        const { success: phoneSuccess, data: phoneNumber } = await SecureStorageService.getValue(
          SecureStorageKeys.PHONE_NUMBER,
        );

        if (phoneSuccess && phoneNumber) {
          await ApiClientService.loginWithBiometrics({ phoneNumber });
          setHasAuthenticated(true);
          // Проверяем статус онбординга перед переходом
          await checkAndNavigateAfterAuth();
          return true;
        }
      } else if (error) {
        console.log('❌ Биометрическая аутентификация не удалась:', error);
      }
      return false;
    } catch (error) {
      console.error('❌ Ошибка при биометрической аутентификации:', error);
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
    resetBiometricsStatus,
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

    try {
      const { available } = await biometrics.current.isSensorAvailable();

      if (!available) {
        console.log('❌ Биометрия недоступна для сохранения');
        return false;
      }

      // Создаем ключи (если существуют, будут перезаписаны)
      const { publicKey } = await biometrics.current.createKeys();

      // Сохраняем публичный ключ на сервере
      const { success, data: phoneNumber } = await SecureStorageService.getValue(
        SecureStorageKeys.PHONE_NUMBER,
      );

      if (success && phoneNumber && publicKey) {
        await ApiClientService.saveBiometricKey({
          phoneNumber,
          publicKey,
        });
        await saveBiometricsStatus(true);
        console.log('✅ Биометрические ключи успешно сохранены');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Ошибка сохранения биометрических ключей:', error);
      return false;
    }
  }, [initBiometrics, saveBiometricsStatus]);

  // Единая функция для настройки биометрии (двухшаговая)
  const setupBiometrics = useCallback(
    async (shouldNavigateOnCancel: boolean = true) => {
      console.log('🔐 setupBiometrics вызван:', {
        isBiometricsEnabled,
        isBiometricsSupported,
        shouldNavigateOnCancel,
      });

      // Если биометрия уже настроена, не показываем диалог повторно
      if (isBiometricsEnabled) {
        console.log('✅ Биометрия уже настроена');
        if (shouldNavigateOnCancel) {
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

        console.log('📱 Результат проверки биометрии:', { available, biometryType });

        if (!available) {
          console.log('❌ Биометрия недоступна');
          if (shouldNavigateOnCancel) {
            await checkAndNavigateAfterAuth();
          }
          return;
        }

        const isFaceId = biometryType === 'FaceID';
        const biometricName = isFaceId ? 'Face ID' : 'Touch ID';

        showAlert({
          title: 'Использовать биометрию для входа?',
          message: `Использовать ${biometricName} для быстрого и безопасного входа в приложение`,
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
                console.log('👆 Пользователь выбрал "Позже"');
                await saveBiometricsStatus(false);
                if (shouldNavigateOnCancel) {
                  await checkAndNavigateAfterAuth();
                }
              },
            },
            {
              text: 'Настроить',
              style: 'default',
              showButtonIcon: true,
              buttonIconName: isFaceId ? IconNames.faceId : IconNames.fingerprint,
              onPress: async () => {
                console.log('👆 Пользователь выбрал "Настроить"');
                if (!biometrics.current) {
                  setErrorMessageWithTimeout('Биометрия недоступна');
                  return;
                }

                try {
                  // ТОЛЬКО ОДИН вызов simplePrompt - для подтверждения настройки
                  console.log('🔐 Запрос биометрии для настройки...');
                  const authResult = await biometrics.current.simplePrompt({
                    promptMessage: `Подтвердите использование ${biometricName}`,
                    cancelButtonText: 'Отмена',
                  });

                  console.log('📱 Результат simplePrompt:', { success: authResult.success });

                  if (authResult.success) {
                    console.log('✅ Биометрия подтверждена, сохраняем ключи...');
                    const success = await saveBiometricKeys();
                    if (success) {
                      console.log('✅ Ключи сохранены, устанавливаем hasAuthenticated=true');
                      setHasAuthenticated(true);

                      showAlert({
                        title: 'Биометрия настроена',
                        message: `${biometricName} успешно настроен для входа`,
                        type: 'info',
                        theme: 'dark',
                        showIcon: true,
                        buttons: [
                          {
                            text: 'Продолжить',
                            style: 'default',
                            onPress: async () => {
                              console.log(
                                '👆 Пользователь нажал "Продолжить", переходим в приложение',
                              );
                              await checkAndNavigateAfterAuth();
                            },
                          },
                        ],
                      });
                    } else {
                      console.log('❌ Не удалось сохранить ключи');
                      setErrorMessageWithTimeout('Не удалось настроить биометрию');
                      if (shouldNavigateOnCancel) {
                        await checkAndNavigateAfterAuth();
                      }
                    }
                  } else {
                    console.log('❌ Пользователь отменил подтверждение биометрии');
                    setErrorMessageWithTimeout('Настройка биометрии отменена');
                    if (shouldNavigateOnCancel) {
                      await checkAndNavigateAfterAuth();
                    }
                  }
                } catch (error) {
                  console.error('❌ Ошибка при настройке:', error);
                  setErrorMessageWithTimeout('Произошла ошибка при настройке биометрии');
                }
              },
            },
          ],
        });
      } catch (error) {
        console.error('❌ Ошибка в setupBiometrics:', error);
        setErrorMessageWithTimeout('Произошла ошибка при настройке биометрии');
      }
    },
    [
      isBiometricsEnabled,
      isBiometricsSupported,
      initBiometrics,
      checkAndNavigateAfterAuth,
      saveBiometricKeys,
      saveBiometricsStatus,
      setErrorMessageWithTimeout,
      showAlert,
      setHasAuthenticated,
    ],
  );

  // Функция для проверки и показа диалога биометрии
  const checkAndShowBiometricsSetup = useCallback(async () => {
    console.log('🔐 checkAndShowBiometricsSetup вызван');

    // Инициализируем биометрию если нужно
    if (!biometrics.current) {
      await initBiometrics();
    }

    // Проверяем поддержку биометрии
    let isSupported = isBiometricsSupported;
    if (biometrics.current && !isSupported) {
      const { available } = await biometrics.current.isSensorAvailable();
      isSupported = available;
      if (available !== isBiometricsSupported) {
        setIsBiometricsSupported(available);
      }
    }

    // Проверяем, был ли завершен процесс настройки
    const { success: setupSuccess, data: setupCompleted } = await SecureStorageService.getValue(
      SecureStorageKeys.BIOMETRIC_SETUP_COMPLETED,
    );
    const isSetupCompleted = setupSuccess && setupCompleted === 'true';

    console.log('📊 Состояние биометрии:', {
      isBiometricsEnabled,
      isBiometricsSupported: isSupported,
      isSetupCompleted,
      isPinCodeSet,
    });

    // Если настройка не была завершена и биометрия поддерживается - показываем диалог
    if (isSupported && !isSetupCompleted) {
      console.log('✅ Показываем диалог настройки биометрии');
      await setupBiometrics(true);
    } else {
      console.log('⏸️ Не показываем диалог биометрии');
      await checkAndNavigateAfterAuth();
    }
  }, [
    isBiometricsSupported,
    isBiometricsEnabled,
    isPinCodeSet,
    initBiometrics,
    setupBiometrics,
    checkAndNavigateAfterAuth,
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
        });

        setCurrentPin('');
        setConfirmPin('');
        setIsPinCodeSet(true);
        setHasAuthenticated(true);
        await checkAndNavigateAfterAuth();
      } catch (error) {
        console.error('Ошибка верификации PIN:', error);

        // Проверяем тип ошибки Axios
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 400) {
            setErrorMessageWithTimeout('Неверный PIN-код');
          } else {
            setErrorMessageWithTimeout('Ошибка сервера, попробуйте позже');
          }
        } else {
          setErrorMessageWithTimeout('Ошибка верификации PIN-кода');
        }

        setCurrentPin('');
        vibrate(VIBRATION_DURATION.ERROR);
      } finally {
        setIsProcessing(false);
      }
    },
    [setErrorMessageWithTimeout, checkAndNavigateAfterAuth],
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
        // НЕ устанавливаем hasAuthenticated здесь, так как пользователь еще не вошел

        // Проверяем и показываем диалог биометрии
        await checkAndShowBiometricsSetup();
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

  // Очистка
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

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

      <AlertComponent />
    </ScreenContainer>
  );
});

export const PinCodeScreen = memo(PinCodeScreenComponent, isEqual);
