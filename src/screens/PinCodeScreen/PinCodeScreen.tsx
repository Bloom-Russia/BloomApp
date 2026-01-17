// PinCodeScreen.tsx
import { RoundLogoAppImage } from '@assets/images';
import { useAuth } from '@contexts';
import { useCustomAlert, useLogOut } from '@hooks';
import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SecureStorageKeys, SecureStorageService } from '@services';
import { Colors, ESize, Icon, IconNames, ScreenContainer } from '@UIKit';
import React, { JSX, memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Vibration } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import {
  BiometricIcon,
  BiometricKeyButton,
  Container,
  DeleteButtonInRow,
  DeleteIcon,
  EmptyButton,
  ErrorText,
  ExitButton,
  ExitIcon,
  KeyboardContainer,
  KeyboardRow,
  KeyButton,
  KeyText,
  LoadingContainer,
  LoadingText,
  LogoContainer,
  MainContainer,
  PinDot,
  PinDotsContainer,
  ResetButton,
  ResetButtonText,
  StyledImage,
  Subtitle,
  Title24,
  TitleContainer,
} from './components';

import {
  ALERT_CONFIG,
  BIOMETRIC_MESSAGES,
  DELAYS,
  ERROR_MESSAGES,
  PIN_CONFIG,
  UI_TEXT,
  VIBRATION_CONFIG,
  WEAK_PINS,
} from './constants'; // Импортируем constants
import { useGetAttemptsLeftText } from './hooks';
import { BiometricError, CommonWeakPin, PinMode, SequentialWeakPin } from './types'; // Инициализация биометрического сервиса

// Инициализация биометрического сервиса
const rnBiometrics = new ReactNativeBiometrics();

// Вспомогательная функция для задержки
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Константы для биометрии
const BIOMETRIC_CONFIG = {
  MAX_ATTEMPTS: 3, // Максимальное количество попыток биометрии
  LOCK_DURATION: 30000, // 30 секунд блокировки
  ATTEMPTS_KEY: 'biometric_attempts', // Ключ для хранения попыток
  LAST_FAILED_KEY: 'biometric_last_failed', // Ключ для хранения времени последней неудачи
  AUTO_PROMPT_DELAY: 500, // Задержка перед автоматическим показом биометрии
  AUTO_PROMPT_SHOWN_KEY: 'biometric_auto_prompt_shown', // Ключ для отслеживания показа авто-промпта
};

/**
 * Экран авторизации по PIN-коду с поддержкой биометрии
 */
export const PinCodeScreen: React.FC<
  NativeStackScreenProps<AuthStackParamList, EScreens.AUTH_PIN_CODE_SCREEN>
> = memo(({ navigation }) => {
  // ============================================
  // СОСТОЯНИЕ КОМПОНЕНТА
  // ============================================
  const [savedPin, setSavedPin] = useState<string | undefined>(undefined);
  const [pinMode, setPinMode] = useState<PinMode>('enter');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinVisible, setPinVisible] = useState(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricAttempts, setBiometricAttempts] = useState<number>(0);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [biometricLockTimeRemaining, setBiometricLockTimeRemaining] = useState<number>(0);
  const [autoPromptShown, setAutoPromptShown] = useState(false); // Флаг показа авто-промпта в этой сессии
  const [isAutoPromptInProgress, setIsAutoPromptInProgress] = useState(false); // Флаг выполнения авто-промпта

  // ============================================
  // REFS ДЛЯ УПРАВЛЕНИЯ ТАЙМЕРАМИ
  // ============================================
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitAlertShownRef = useRef<boolean>(false); // Реф для отслеживания показа алерта выхода
  const biometricLockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const biometricCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPromptTimerRef = useRef<NodeJS.Timeout | null>(null); // Реф для таймера авто-промпта

  // ============================================
  // КОНТЕКСТЫ И ВСПОМОГАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ
  // ============================================
  const { setIsVerified } = useAuth();
  const hasEnteredSymbols = currentPin.length > 0 || confirmPin.length > 0;

  // ============================================
  // ХУКИ ДЛЯ КАСТОМНЫХ АЛЕРТОВ
  // ============================================
  const { showAlert: showCustomAlert, AlertComponent } = useCustomAlert();

  // ============================================
  // ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ТАЙМЕРАМИ БЛОКИРОВКИ
  // ============================================
  const startCountdownTimer = useCallback((durationMs: number): void => {
    let secondsRemaining = Math.ceil(durationMs / 1000);
    setLockTimeRemaining(secondsRemaining);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    countdownTimerRef.current = setInterval(() => {
      secondsRemaining -= 1;
      setLockTimeRemaining(secondsRemaining);

      if (secondsRemaining <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    }, 1000);
  }, []);

  const stopCountdownTimer = useCallback((): void => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setLockTimeRemaining(0);
  }, []);

  const startBiometricCountdownTimer = useCallback((durationMs: number): void => {
    let secondsRemaining = Math.ceil(durationMs / 1000);
    setBiometricLockTimeRemaining(secondsRemaining);

    if (biometricCountdownTimerRef.current) {
      clearInterval(biometricCountdownTimerRef.current);
      biometricCountdownTimerRef.current = null;
    }

    biometricCountdownTimerRef.current = setInterval(() => {
      secondsRemaining -= 1;
      setBiometricLockTimeRemaining(secondsRemaining);

      if (secondsRemaining <= 0) {
        if (biometricCountdownTimerRef.current) {
          clearInterval(biometricCountdownTimerRef.current);
          biometricCountdownTimerRef.current = null;
        }
      }
    }, 1000);
  }, []);

  const stopBiometricCountdownTimer = useCallback((): void => {
    if (biometricCountdownTimerRef.current) {
      clearInterval(biometricCountdownTimerRef.current);
      biometricCountdownTimerRef.current = null;
    }
    setBiometricLockTimeRemaining(0);
  }, []);

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================

  //Функция выхода из приложения
  const { logOutHandler } = useLogOut();

  const triggerVibration = useCallback((): void => {
    if (PIN_CONFIG.VIBRATION_ENABLED) {
      Vibration.vibrate(VIBRATION_CONFIG.DURATION);
    }
  }, []);

  const clearPinInput = useCallback((): void => {
    setCurrentPin('');
    setConfirmPin('');
  }, []);

  const isWeakPin = useCallback((pinCode: string): boolean => {
    if (WEAK_PINS.REGEX.SAME_DIGITS.test(pinCode)) {
      return true;
    }

    if (WEAK_PINS.SEQUENTIAL.includes(pinCode as SequentialWeakPin)) {
      return true;
    }

    // Используем правильную типизацию
    return WEAK_PINS.COMMON.includes(pinCode as CommonWeakPin);
  }, []);

  // ============================================
  // ОБРАБОТКА ОШИБОК И СООБЩЕНИЙ
  // ============================================
  const showError = useCallback((message: string): void => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    setErrorMessage(message);

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage('');
      errorTimerRef.current = null;
    }, PIN_CONFIG.ERROR_DISPLAY_TIME);
  }, []);

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ БИОМЕТРИИ
  // ============================================
  const resetBiometricAttempts = useCallback(async (): Promise<void> => {
    setBiometricAttempts(0);
    await Promise.all([
      SecureStorageService.saveValue(BIOMETRIC_CONFIG.ATTEMPTS_KEY, '0'),
      SecureStorageService.removeValue(BIOMETRIC_CONFIG.LAST_FAILED_KEY),
    ]);
  }, []);

  const loadBiometricAttempts = useCallback(async (): Promise<void> => {
    try {
      const [attemptsResult, lastFailedResult] = await Promise.all([
        SecureStorageService.getValue(BIOMETRIC_CONFIG.ATTEMPTS_KEY),
        SecureStorageService.getValue(BIOMETRIC_CONFIG.LAST_FAILED_KEY),
      ]);

      const savedAttempts = attemptsResult.success ? Number(attemptsResult.data) || 0 : 0;
      const lastFailedTime = lastFailedResult.success ? Number(lastFailedResult.data) || 0 : 0;

      setBiometricAttempts(savedAttempts);

      if (savedAttempts >= BIOMETRIC_CONFIG.MAX_ATTEMPTS && lastFailedTime > 0) {
        const timePassed = Date.now() - lastFailedTime;
        const timeRemaining = Math.max(0, BIOMETRIC_CONFIG.LOCK_DURATION - timePassed);

        if (timeRemaining > 0) {
          setIsBiometricLocked(true);
          startBiometricCountdownTimer(timeRemaining);

          if (biometricLockTimerRef.current) {
            clearTimeout(biometricLockTimerRef.current);
          }
          biometricLockTimerRef.current = setTimeout(() => {
            setIsBiometricLocked(false);
            stopBiometricCountdownTimer();
            resetBiometricAttempts();
          }, timeRemaining);
        } else {
          await resetBiometricAttempts();
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки попыток биометрии:', error);
    }
  }, [startBiometricCountdownTimer, stopBiometricCountdownTimer, resetBiometricAttempts]);

  const loadAutoPromptShown = useCallback(async (): Promise<boolean> => {
    try {
      const result = await SecureStorageService.getValue(BIOMETRIC_CONFIG.AUTO_PROMPT_SHOWN_KEY);
      // Явно преобразуем результат к boolean
      return result.success ? result.data === 'true' : false;
    } catch (error) {
      console.error('Ошибка загрузки состояния авто-промпта:', error);
      return false;
    }
  }, []);

  const saveAutoPromptShown = useCallback(async (): Promise<void> => {
    try {
      await SecureStorageService.saveValue(BIOMETRIC_CONFIG.AUTO_PROMPT_SHOWN_KEY, 'true');
      setAutoPromptShown(true);
    } catch (error) {
      console.error('Ошибка сохранения состояния авто-промпта:', error);
    }
  }, []);

  const resetAutoPromptShown = useCallback(async (): Promise<void> => {
    try {
      await SecureStorageService.removeValue(BIOMETRIC_CONFIG.AUTO_PROMPT_SHOWN_KEY);
      setAutoPromptShown(false);
    } catch (error) {
      console.error('Ошибка сброса состояния авто-промпта:', error);
    }
  }, []);

  const incrementBiometricAttempt = useCallback(async (): Promise<void> => {
    const newAttempts = biometricAttempts + 1;
    setBiometricAttempts(newAttempts);

    await SecureStorageService.saveValue(BIOMETRIC_CONFIG.ATTEMPTS_KEY, newAttempts.toString());

    if (newAttempts >= BIOMETRIC_CONFIG.MAX_ATTEMPTS) {
      await SecureStorageService.saveValue(BIOMETRIC_CONFIG.LAST_FAILED_KEY, Date.now().toString());
      setIsBiometricLocked(true);

      startBiometricCountdownTimer(BIOMETRIC_CONFIG.LOCK_DURATION);

      if (biometricLockTimerRef.current) {
        clearTimeout(biometricLockTimerRef.current);
      }
      biometricLockTimerRef.current = setTimeout(() => {
        setIsBiometricLocked(false);
        stopBiometricCountdownTimer();
        resetBiometricAttempts();
      }, BIOMETRIC_CONFIG.LOCK_DURATION);
    }
  }, [
    biometricAttempts,
    startBiometricCountdownTimer,
    stopBiometricCountdownTimer,
    resetBiometricAttempts,
  ]);

  // Функция проверки настройки биометрии
  const checkBiometricSetup = useCallback(async (): Promise<boolean> => {
    try {
      const hasBiometricKey = await SecureStorageService.hasValue(SecureStorageKeys.BIOMETRIC_KEY);
      // Явно проверяем, что data существует и равно true
      return hasBiometricKey.success && hasBiometricKey.data === true;
    } catch (error) {
      console.error('Ошибка проверки настройки биометрии:', error);
      return false;
    }
  }, []);

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРОВЕРКИ PIN
  // ============================================
  const checkPinExists = useCallback(async (): Promise<boolean> => {
    try {
      // Сначала проверяем локальное состояние для быстрого ответа
      if (savedPin) {
        return true;
      }

      // Если локально нет, проверяем хранилище
      const pinResult = await SecureStorageService.loadPin();
      // Явно преобразуем к boolean
      const hasPin = Boolean(pinResult.success && pinResult.data);

      // Обновляем локальное состояние для будущих проверок
      if (hasPin && !savedPin) {
        setSavedPin(pinResult.data || undefined);
      }

      return hasPin;
    } catch (error) {
      console.error('Ошибка проверки наличия PIN:', error);
      return false;
    }
  }, [savedPin]);

  // Функция для показа алерта о необходимости PIN
  const showNoPinAlert = useCallback((): void => {
    triggerVibration();

    showCustomAlert({
      title: 'Установите PIN код',
      message: 'Вход по биометрии будет возможен, только если установлен PIN код!',
      type: 'info',
      theme: 'dark',
      showIcon: true,
      shadow: true,
      shadowColorDark: Colors.white,
      buttons: [
        {
          text: 'OK',
          onPress: () => {},
          style: 'default',
          closeOnPress: true,
          showButtonIcon: true,
          buttonIconName: IconNames.success,
        },
      ],
    });
  }, [triggerVibration, showCustomAlert]);

  // ============================================
  // АУТЕНТИФИКАЦИЯ И УПРАВЛЕНИЕ PIN-КОДОМ
  // ============================================
  const handleSuccessfulAuth = useCallback(async (): Promise<void> => {
    try {
      await SecureStorageService.resetPinAttempts();
      await SecureStorageService.savePinLastSuccess();
      await resetBiometricAttempts(); // Сбрасываем попытки биометрии при успешной аутентификации
      await resetAutoPromptShown(); // Сбрасываем флаг авто-промпта при успешном входе

      setAttempts(0);
      setIsLocked(false);
      setIsBiometricLocked(false);
      stopCountdownTimer();
      stopBiometricCountdownTimer();
      clearPinInput();
      setErrorMessage('');

      await setIsVerified(true);

      await delay(DELAYS.SUCCESS_AUTH);

      setPinVisible(false);
      navigation.replace(EScreens.EXAMPLE_SCREEN);
    } catch (error) {
      console.error('Ошибка при успешной аутентификации:', error);
      showError(ERROR_MESSAGES.AUTH);
    }
  }, [
    navigation,
    setIsVerified,
    stopCountdownTimer,
    stopBiometricCountdownTimer,
    showError,
    clearPinInput,
    resetBiometricAttempts,
    resetAutoPromptShown,
  ]);

  const handleBiometricAuthInternal = useCallback(
    async (
      promptMessage: string,
      onSuccess: () => Promise<void>,
      isAutoPrompt: boolean = false,
    ): Promise<void> => {
      if (!biometricAvailable) {
        showError(ERROR_MESSAGES.BIOMETRY.UNAVAILABLE);
        return;
      }

      if (isBiometricLocked) {
        showError(
          `Не удалось выполнить биометрическую аутентификацию. Попробуйте через ${biometricLockTimeRemaining} секунд`,
        );
        return;
      }

      try {
        const hasBiometricKey = await SecureStorageService.hasValue(
          SecureStorageKeys.BIOMETRIC_KEY,
        );

        if (!hasBiometricKey.success || !hasBiometricKey.data) {
          const { publicKey } = await rnBiometrics.createKeys();
          await SecureStorageService.saveValue(SecureStorageKeys.BIOMETRIC_KEY, publicKey);
        }

        const { success } = await rnBiometrics.simplePrompt({
          promptMessage,
          cancelButtonText: BIOMETRIC_MESSAGES.CANCEL,
        });

        if (success) {
          // Сбрасываем попытки при успешной биометрии
          await resetBiometricAttempts();
          await delay(100);
          await onSuccess();
        } else {
          // Инкрементируем попытку при отмене пользователем (только если не авто-промпт)
          if (!isAutoPrompt) {
            await incrementBiometricAttempt();
          }
          await delay(100);
        }
      } catch (error: unknown) {
        console.error('Ошибка биометрической аутентификации:', error);
        const err = error as BiometricError;

        await delay(100);

        if (err.code !== 'USER_CANCELED') {
          // Инкрементируем попытку при ошибке (только если не авто-промпт)
          if (!isAutoPrompt) {
            await incrementBiometricAttempt();
          }
          showError(
            `Не удалось выполнить биометрическую аутентификацию. Осталось попыток: ${
              BIOMETRIC_CONFIG.MAX_ATTEMPTS - biometricAttempts
            }`,
          );
        }
      }
    },
    [
      biometricAvailable,
      showError,
      isBiometricLocked,
      biometricLockTimeRemaining,
      incrementBiometricAttempt,
      resetBiometricAttempts,
      biometricAttempts,
    ],
  );

  const handleBiometricAuth = useCallback(async (): Promise<void> => {
    if (isLocked) {
      return;
    }

    // Проверяем, установлен ли PIN код
    const hasPin = await checkPinExists();
    if (!hasPin) {
      showNoPinAlert();
      return;
    }

    // Ручной вызов биометрии - сбрасываем флаг авто-промпта, чтобы можно было вызывать снова
    if (autoPromptShown) {
      await resetAutoPromptShown();
    }

    await handleBiometricAuthInternal(BIOMETRIC_MESSAGES.PROMPT, async () => {
      await handleSuccessfulAuth();
    });
  }, [
    isLocked,
    autoPromptShown,
    checkPinExists,
    showNoPinAlert,
    handleBiometricAuthInternal,
    handleSuccessfulAuth,
    resetAutoPromptShown,
  ]);

  const handleBiometricAuthWhenLocked = useCallback(async (): Promise<void> => {
    // Проверяем, установлен ли PIN код даже при блокировке
    const hasPin = await checkPinExists();
    if (!hasPin) {
      showNoPinAlert();
      return;
    }

    // Ручной вызов биометрии - сбрасываем флаг авто-промпта
    if (autoPromptShown) {
      await resetAutoPromptShown();
    }

    await handleBiometricAuthInternal(BIOMETRIC_MESSAGES.PROMPT_UNLOCK, async () => {
      await SecureStorageService.resetPinAttempts();
      setAttempts(0);
      setIsLocked(false);
      stopCountdownTimer();
      await handleSuccessfulAuth();
    });
  }, [
    checkPinExists,
    showNoPinAlert,
    autoPromptShown,
    handleBiometricAuthInternal,
    stopCountdownTimer,
    handleSuccessfulAuth,
    resetAutoPromptShown,
  ]);

  // Функция для автоматического показа биометрии (ТОЛЬКО ОДИН РАЗ)
  const triggerAutoBiometricPrompt = useCallback(async (): Promise<void> => {
    if (isAutoPromptInProgress || autoPromptShown) {
      console.log('Авто-промпт уже показан или в процессе');
      return;
    }

    setIsAutoPromptInProgress(true);

    try {
      // Проверяем все условия для автоматического показа биометрии
      const hasPin = await checkPinExists();
      const isBiometricSetup = await checkBiometricSetup();

      const shouldTriggerAutoPrompt =
        !isLocked && // Не заблокирован PIN
        !isBiometricLocked && // Не заблокирована биометрия
        hasPin && // PIN установлен
        isBiometricSetup && // Биометрия настроена
        biometricAvailable && // Биометрия доступна
        pinMode === 'enter' && // Режим ввода PIN
        pinVisible && // Экран видим
        !autoPromptShown; // Авто-промпт еще не показывался

      if (shouldTriggerAutoPrompt) {
        console.log('Условия выполнены, запускаю авто-биометрию...');

        // Помечаем, что авто-промпт был показан (сохраняем локально и в хранилище)
        await saveAutoPromptShown();

        await delay(BIOMETRIC_CONFIG.AUTO_PROMPT_DELAY);

        // Запускаем биометрию
        await handleBiometricAuthInternal(
          BIOMETRIC_MESSAGES.PROMPT,
          async () => {
            await handleSuccessfulAuth();
          },
          true, // Указываем, что это авто-промпт
        );
      }
    } catch (error) {
      console.error('Ошибка при авто-показе биометрии:', error);
    } finally {
      setIsAutoPromptInProgress(false);
    }
  }, [
    isLocked,
    isBiometricLocked,
    pinMode,
    pinVisible,
    biometricAvailable,
    autoPromptShown,
    isAutoPromptInProgress,
    checkPinExists,
    checkBiometricSetup,
    saveAutoPromptShown,
    handleBiometricAuthInternal,
    handleSuccessfulAuth,
  ]);

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [pinResult, attemptsResult, lastFailedResult, autoPromptResult] = await Promise.all([
        SecureStorageService.loadPin(),
        SecureStorageService.loadPinAttempts(),
        SecureStorageService.loadPinLastFailed(),
        loadAutoPromptShown(),
      ]);

      const savedPinValue = pinResult.success ? pinResult.data : null;
      const savedAttempts = attemptsResult.success ? attemptsResult.data ?? 0 : 0;
      const lastFailedTime = lastFailedResult.success ? lastFailedResult.data ?? 0 : 0;

      setSavedPin(savedPinValue || undefined);
      setPinMode(savedPinValue ? 'enter' : 'set');
      setAttempts(savedAttempts);

      // ВАЖНОЕ ИСПРАВЛЕНИЕ: autoPromptResult уже boolean, не нужно преобразовывать
      // Просто передаем его напрямую, так как loadAutoPromptShown гарантированно возвращает boolean
      setAutoPromptShown(autoPromptResult);

      if (savedAttempts >= PIN_CONFIG.MAX_ATTEMPTS && lastFailedTime > 0) {
        const timePassed = Date.now() - lastFailedTime;
        const timeRemaining = Math.max(0, PIN_CONFIG.LOCK_DURATION - timePassed);

        if (timeRemaining > 0) {
          setIsLocked(true);
          clearPinInput(); // Очищаем PIN при блокировке
          startCountdownTimer(timeRemaining);

          if (unlockTimerRef.current) {
            clearTimeout(unlockTimerRef.current);
          }
          unlockTimerRef.current = setTimeout(() => {
            setIsLocked(false);
            stopCountdownTimer();
            SecureStorageService.resetPinAttempts();
            setAttempts(0);
          }, timeRemaining);
        } else {
          await SecureStorageService.resetPinAttempts();
          setAttempts(0);
        }
      }

      // Загружаем попытки биометрии
      await loadBiometricAttempts();

      setPinVisible(true);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setPinMode('set');
      setPinVisible(true);
      showError(ERROR_MESSAGES.DATA.LOAD);
    } finally {
      setIsLoading(false);
    }
  }, [
    startCountdownTimer,
    stopCountdownTimer,
    showError,
    clearPinInput,
    loadBiometricAttempts,
    loadAutoPromptShown,
  ]);

  const newAttempts = attempts + 1;

  const errorText = useGetAttemptsLeftText(PIN_CONFIG.MAX_ATTEMPTS - newAttempts);

  const handleEnterPin = useCallback(
    async (enteredPin: string): Promise<void> => {
      console.log('handleEnterPin вызван с PIN:', enteredPin, 'длина:', enteredPin.length);

      if (isLocked || !savedPin) {
        console.log('Пропускаем: isLocked =', isLocked, 'savedPin =', savedPin);
        return;
      }

      console.log('Сравниваем enteredPin:', enteredPin, 'с savedPin:', savedPin);

      if (savedPin === enteredPin) {
        console.log('PIN верный!');
        await handleSuccessfulAuth();
      } else {
        console.log('PIN неверный! Очищаем поле...');
        setAttempts(newAttempts);

        clearPinInput();
        showError(errorText);

        if (newAttempts >= PIN_CONFIG.MAX_ATTEMPTS) {
          const saveFailedResult = await SecureStorageService.savePinLastFailed();
          if (!saveFailedResult.success) {
            console.error(ERROR_MESSAGES.DATA.SAVE_FAILED_TIME);
          }

          setIsLocked(true);
          clearPinInput(); // Очищаем PIN при блокировке

          startCountdownTimer(PIN_CONFIG.LOCK_DURATION);

          if (lockTimerRef.current) {
            clearTimeout(lockTimerRef.current);
          }
          lockTimerRef.current = setTimeout(() => {
            setIsLocked(false);
            stopCountdownTimer();
            SecureStorageService.resetPinAttempts();
            setAttempts(0);
          }, PIN_CONFIG.LOCK_DURATION);
        }
      }
    },
    [
      isLocked,
      savedPin,
      handleSuccessfulAuth,
      newAttempts,
      clearPinInput,
      showError,
      errorText,
      startCountdownTimer,
      stopCountdownTimer,
    ],
  );

  const handleSetPin = useCallback(
    async (newPin: string): Promise<void> => {
      if (isWeakPin(newPin)) {
        showError(ERROR_MESSAGES.PIN.WEAK);
        clearPinInput();
        setPinMode('set');
        return;
      }

      setIsLoading(true);
      try {
        const saveResult = await SecureStorageService.savePin(newPin);
        if (!saveResult.success) {
          throw new Error(ERROR_MESSAGES.PIN.SAVE);
        }

        await SecureStorageService.resetPinAttempts();
        setSavedPin(newPin);
        setPinMode('enter');
        await handleSuccessfulAuth();
      } catch (error) {
        console.error('Ошибка сохранения PIN:', error);
        showError(ERROR_MESSAGES.PIN.SAVE);
        clearPinInput();
        setPinMode('set');
      } finally {
        setIsLoading(false);
      }
    },
    [handleSuccessfulAuth, showError, clearPinInput, isWeakPin],
  );

  // ============================================
  // ОБРАБОТЧИКИ ВВОДА
  // ============================================
  const handleNumberPress = useCallback(
    async (number: string): Promise<void> => {
      if (isLocked || isProcessing) {
        console.log('БЛОКИРОВКА: isLocked или isProcessing');
        return;
      }

      setIsProcessing(true);
      triggerVibration();

      const PIN_LENGTH = PIN_CONFIG.LENGTH;

      // Используем setTimeout для разделения обновлений состояния
      setTimeout(async () => {
        try {
          if (pinMode === 'set') {
            console.log('Режим: set');
            if (currentPin.length < PIN_LENGTH) {
              const newPin = currentPin + number;
              console.log('Новый PIN (set):', newPin, 'длина:', newPin.length);

              // Сначала обновляем текущий PIN
              setCurrentPin(newPin);

              if (newPin.length === PIN_LENGTH) {
                console.log('Достигнута максимальная длина PIN, переключаем на confirm');
                // Задержка перед переходом в режим подтверждения
                setTimeout(() => {
                  setPinMode('confirm');
                  // Очищаем confirmPin при переходе в режим подтверждения
                  setConfirmPin('');
                }, 100); // Задержка для отображения точек
              }
            }
          } else if (pinMode === 'confirm') {
            console.log('Режим: confirm');
            if (confirmPin.length < PIN_LENGTH) {
              const newConfirmPin = confirmPin + number;
              console.log(
                'Новый подтверждающий PIN:',
                newConfirmPin,
                'длина:',
                newConfirmPin.length,
              );
              setConfirmPin(newConfirmPin);

              if (newConfirmPin.length === PIN_LENGTH) {
                console.log('Сравниваем:', currentPin, 'с', newConfirmPin);

                // Задержка для отображения заполненных точек
                setTimeout(async () => {
                  if (currentPin === newConfirmPin) {
                    console.log('PIN совпали, сохраняем...');
                    await handleSetPin(currentPin);
                  } else {
                    console.log('PIN не совпали');
                    showError(ERROR_MESSAGES.PIN.MISMATCH);

                    // Задержка перед очисткой полей
                    setTimeout(() => {
                      clearPinInput();
                      setPinMode('set');
                    }, 100);
                  }
                }, 100);
              }
            }
          } else if (pinMode === 'enter') {
            console.log('Режим: enter');
            if (currentPin.length < PIN_LENGTH) {
              const newPin = currentPin + number;
              console.log('Новый PIN (enter):', newPin, 'длина:', newPin.length);
              setCurrentPin(newPin);

              if (newPin.length === PIN_LENGTH) {
                console.log('PIN введен полностью, проверяем...');
                // Задержка для отображения заполненных точек
                setTimeout(async () => {
                  await handleEnterPin(newPin);
                }, 100);
              }
            }
          }
        } catch (error) {
          console.error('Ошибка в обработчике нажатия:', error);
        } finally {
          // Задержка сброса isProcessing
          setTimeout(() => {
            console.log('Сбрасываем isProcessing');
            setIsProcessing(false);
          }, DELAYS.PROCESSING_RESET);
        }
      }, 0);
    },
    [
      clearPinInput,
      confirmPin,
      currentPin,
      handleEnterPin,
      handleSetPin,
      isLocked,
      isProcessing,
      pinMode,
      showError,
      triggerVibration,
    ],
  );

  const handleDeletePress = useCallback((): void => {
    if (isLocked) {
      return;
    }

    triggerVibration();

    if (pinMode === 'confirm') {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setPinMode('set');
      }
    } else {
      if (currentPin.length > 0) {
        setCurrentPin(currentPin.slice(0, -1));
      }
    }
  }, [pinMode, currentPin, confirmPin, isLocked, triggerVibration]);

  // ============================================
  // ОБРАБОТЧИКИ С ВИБРАЦИЕЙ И АЛЕРТАМИ
  // ============================================
  const handleBiometricAuthWithVibration = useCallback(async (): Promise<void> => {
    if (isBiometricLocked) {
      showError(
        `Не удалось выполнить биометрическую аутентификацию. Попробуйте через ${biometricLockTimeRemaining} секунд`,
      );
      return;
    }

    triggerVibration();
    await handleBiometricAuth();
  }, [
    handleBiometricAuth,
    triggerVibration,
    isBiometricLocked,
    biometricLockTimeRemaining,
    showError,
  ]);

  const handleBiometricAuthWhenLockedWithVibration = useCallback(async (): Promise<void> => {
    if (isBiometricLocked) {
      showError(
        `Не удалось выполнить биометрическую аутентификацию. Попробуйте через ${biometricLockTimeRemaining} секунд`,
      );
      return;
    }

    triggerVibration();
    await handleBiometricAuthWhenLocked();
  }, [
    handleBiometricAuthWhenLocked,
    triggerVibration,
    isBiometricLocked,
    biometricLockTimeRemaining,
    showError,
  ]);

  const handleExitAppWithVibration = useCallback((): void => {
    // Проверяем, не показан ли уже алерт
    if (exitAlertShownRef.current) {
      return;
    }

    triggerVibration();
    exitAlertShownRef.current = true;

    // Используем наш кастомный алерт для выхода из приложения
    showCustomAlert({
      title: ALERT_CONFIG.EXIT.TITLE,
      message: ALERT_CONFIG.EXIT.MESSAGE,
      type: 'error',
      theme: 'dark',
      showIcon: true,
      shadow: true,
      shadowColorDark: Colors.white,
      buttons: [
        {
          text: ALERT_CONFIG.EXIT.CANCEL,
          onPress: () => {
            console.log('Отмена выхода');
            exitAlertShownRef.current = false; // Сбрасываем флаг при отмене
          },
          style: 'cancel',
          closeOnPress: true,
          // Добавляем иконку для кнопки Cancel
          showButtonIcon: true,
          buttonIconName: IconNames.cancel,
        },
        {
          text: ALERT_CONFIG.EXIT.CONFIRM,
          onPress: async (): Promise<void> => {
            try {
              await logOutHandler();
            } catch (error) {
              console.error('Ошибка при выходе из приложения:', error);
              showError(ERROR_MESSAGES.EXIT_APP);
            } finally {
              exitAlertShownRef.current = false; // Сбрасываем флаг после выполнения
            }
          },
          style: 'destructive',
          closeOnPress: true,
          // Добавляем иконку для деструктивной кнопки
          showButtonIcon: true,
          buttonIconName: IconNames.signOut,
        },
      ],
    });

    // Автоматический сброс флага через 5 секунд на случай,
    // если алерт закроется без вызова onPress
    setTimeout(() => {
      exitAlertShownRef.current = false;
    }, 5000);
  }, [triggerVibration, showCustomAlert, logOutHandler, showError]);

  const handleResetPinWithVibration = useCallback((): void => {
    if (isLocked) {
      return;
    }

    triggerVibration();

    // Используем наш кастомный алерт для сброса PIN-кода
    showCustomAlert({
      title: ALERT_CONFIG.RESET_PIN.TITLE,
      message: ALERT_CONFIG.RESET_PIN.MESSAGE,
      type: 'warning',
      theme: 'dark',
      showIcon: true,
      buttons: [
        {
          text: ALERT_CONFIG.RESET_PIN.CANCEL,
          onPress: () => {
            console.log('Отмена сброса PIN');
          },
          style: 'cancel',
          closeOnPress: true,
          // Добавляем иконку для кнопки Cancel
          showButtonIcon: true,
          buttonIconName: IconNames.cancel,
        },
        {
          text: ALERT_CONFIG.RESET_PIN.CONFIRM,
          onPress: async (): Promise<void> => {
            try {
              const [pinRemoveResult, attemptsResetResult] = await Promise.all([
                SecureStorageService.removePin(),
                SecureStorageService.resetPinAttempts(),
              ]);

              if (pinRemoveResult.success && attemptsResetResult.success) {
                setSavedPin(undefined);
                setPinMode('set');
                clearPinInput();
                setAttempts(0);
                setIsLocked(false);
                setIsBiometricLocked(false);
                setAutoPromptShown(false);
                stopCountdownTimer();
                stopBiometricCountdownTimer();
                await resetBiometricAttempts();
                await resetAutoPromptShown();

                // Показываем успешное сообщение через наш же алерт
                showCustomAlert({
                  title: 'Успех',
                  message: 'PIN-код успешно сброшен',
                  type: 'info',
                  theme: 'dark',
                  showIcon: true,
                  buttons: [
                    {
                      text: 'OK',
                      onPress: () => {},
                      style: 'cancel',
                      closeOnPress: true,
                      showButtonIcon: true,
                      buttonIconName: IconNames.success,
                    },
                  ],
                });
              } else {
                showError(ERROR_MESSAGES.PIN.RESET);
              }
            } catch (error) {
              console.error('Ошибка сброса PIN:', error);
              showError(ERROR_MESSAGES.PIN.RESET);
            }
          },
          style: 'destructive',
          closeOnPress: true,
          // Добавляем иконку для деструктивной кнопки
          showButtonIcon: true,
          buttonIconName: IconNames.reload,
        },
      ],
    });
  }, [
    stopCountdownTimer,
    stopBiometricCountdownTimer,
    showError,
    triggerVibration,
    isLocked,
    clearPinInput,
    showCustomAlert,
    resetBiometricAttempts,
    resetAutoPromptShown,
  ]);

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ
  // ============================================
  const formatLockTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} ${UI_TEXT.MINUTES} ${remainingSeconds} ${UI_TEXT.SECONDS}`;
    }
    return `${remainingSeconds} ${UI_TEXT.SECONDS}`;
  }, []);

  const getSubtitle = useCallback((): string => {
    if (isLocked) {
      return `${UI_TEXT.REPEAT_AFTER} ${formatLockTime(lockTimeRemaining)}`;
    }

    if (pinMode === 'set') {
      return 'Установите новый PIN-код для защиты приложения';
    } else if (pinMode === 'confirm') {
      return 'Повторите PIN-код для подтверждения';
    } else {
      return 'Введите PIN-код для входа в приложение';
    }
  }, [isLocked, lockTimeRemaining, pinMode, formatLockTime]);

  const getTitle = useCallback((): string => {
    if (isLocked) {
      return UI_TEXT.LOCKED_TITLE;
    }

    if (pinMode === 'set') {
      return 'Установите PIN-код';
    } else if (pinMode === 'confirm') {
      return 'Подтвердите PIN-код';
    } else {
      return 'Введите PIN-код';
    }
  }, [pinMode, isLocked]);

  const renderPinDots = useCallback((): JSX.Element => {
    // При блокировке всегда показываем пустые точки
    if (isLocked) {
      const dots: JSX.Element[] = [];
      for (let i = 0; i < PIN_CONFIG.LENGTH; i++) {
        dots.push(<PinDot key={i} filled={false} />);
      }
      return <PinDotsContainer>{dots}</PinDotsContainer>;
    }

    const length = pinMode === 'confirm' ? confirmPin?.length ?? 0 : currentPin?.length ?? 0;

    const dots: JSX.Element[] = [];

    for (let i = 0; i < PIN_CONFIG.LENGTH; i++) {
      const isFilled = i < (length ?? 0);
      dots.push(<PinDot key={i} filled={isFilled} />);
    }

    return <PinDotsContainer>{dots}</PinDotsContainer>;
  }, [pinMode, currentPin, confirmPin, isLocked]);

  const getActionButton = useCallback((): JSX.Element => {
    // На заблокированном экране показываем кнопку биометрии
    if (isLocked) {
      return (
        <BiometricKeyButton
          onPress={handleBiometricAuthWhenLockedWithVibration}
          disabled={!biometricAvailable || isBiometricLocked}
        >
          <BiometricIcon disabled={!biometricAvailable || isBiometricLocked}>
            <Icon
              size={ESize.s40}
              color={!biometricAvailable || isBiometricLocked ? Colors.gray : Colors.white}
              name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
            />
          </BiometricIcon>
        </BiometricKeyButton>
      );
    } else {
      if (hasEnteredSymbols) {
        return (
          <DeleteButtonInRow onPress={handleDeletePress} disabled={false}>
            <DeleteIcon disabled={false}>⌫</DeleteIcon>
          </DeleteButtonInRow>
        );
      } else {
        return (
          <BiometricKeyButton
            onPress={handleBiometricAuthWithVibration}
            disabled={!biometricAvailable || isBiometricLocked}
          >
            <BiometricIcon disabled={!biometricAvailable || isBiometricLocked}>
              <Icon
                size={ESize.s40}
                color={!biometricAvailable || isBiometricLocked ? Colors.gray : Colors.white}
                name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
              />
            </BiometricIcon>
          </BiometricKeyButton>
        );
      }
    }
  }, [
    isLocked,
    biometricAvailable,
    isBiometricLocked,
    hasEnteredSymbols,
    handleBiometricAuthWhenLockedWithVibration,
    handleDeletePress,
    handleBiometricAuthWithVibration,
  ]);

  // ============================================
  // ЭФФЕКТЫ
  // ============================================
  useEffect(() => {
    return (): void => {
      [
        errorTimerRef,
        lockTimerRef,
        unlockTimerRef,
        countdownTimerRef,
        biometricLockTimerRef,
        biometricCountdownTimerRef,
        autoPromptTimerRef,
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });
    };
  }, []);

  useEffect(() => {
    const checkBiometricAvailability = async (): Promise<void> => {
      try {
        const { available } = await rnBiometrics.isSensorAvailable();
        setBiometricAvailable(available);
      } catch (error) {
        console.error('Ошибка проверки биометрии:', error);
        setBiometricAvailable(false);
      }
    };

    checkBiometricAvailability();
    loadInitialData();
  }, [loadInitialData]);

  // Эффект для очистки PIN при блокировке
  useEffect(() => {
    if (isLocked) {
      clearPinInput();
    }
  }, [isLocked, clearPinInput]);

  // Эффект для автоматического показа биометрии ОДИН РАЗ
  useEffect(() => {
    if (
      !isLoading &&
      pinVisible &&
      pinMode === 'enter' &&
      !isLocked &&
      !isBiometricLocked &&
      !autoPromptShown &&
      !isAutoPromptInProgress
    ) {
      // Очищаем предыдущий таймер
      if (autoPromptTimerRef.current) {
        clearTimeout(autoPromptTimerRef.current);
        autoPromptTimerRef.current = null;
      }

      // Запускаем проверку через небольшую задержку
      autoPromptTimerRef.current = setTimeout(() => {
        triggerAutoBiometricPrompt();
      }, BIOMETRIC_CONFIG.AUTO_PROMPT_DELAY);
    }

    return () => {
      if (autoPromptTimerRef.current) {
        clearTimeout(autoPromptTimerRef.current);
        autoPromptTimerRef.current = null;
      }
    };
  }, [
    isLoading,
    pinVisible,
    pinMode,
    isLocked,
    isBiometricLocked,
    autoPromptShown,
    isAutoPromptInProgress,
    triggerAutoBiometricPrompt,
  ]);

  // ============================================
  // ОТОБРАЖЕНИЕ СОСТОЯНИЯ ЗАГРУЗКИ
  // ============================================
  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingContainer>
          <ActivityIndicator size="large" color={Colors.white} />
          <LoadingText>{UI_TEXT.LOADING}</LoadingText>
        </LoadingContainer>
      </ScreenContainer>
    );
  }

  // ============================================
  // ОСНОВНОЙ РЕНДЕРИНГ
  // ============================================
  return (
    <Container>
      {pinVisible && (
        <>
          <LogoContainer>
            <StyledImage source={RoundLogoAppImage} />
          </LogoContainer>

          <MainContainer>
            <TitleContainer>
              <Title24>{getTitle()}</Title24>
              <Subtitle>{getSubtitle()}</Subtitle>
            </TitleContainer>

            {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

            {isBiometricLocked && (
              <ErrorText>
                Биометрия заблокирована. Попробуйте через {biometricLockTimeRemaining} секунд
              </ErrorText>
            )}

            {renderPinDots()}

            {pinMode === 'enter' && savedPin && !isLocked && (
              <ResetButton onPress={handleResetPinWithVibration}>
                <ResetButtonText>{UI_TEXT.FORGOT_PIN}</ResetButtonText>
              </ResetButton>
            )}

            <KeyboardContainer>
              <KeyboardRow>
                <KeyButton onPress={() => handleNumberPress('1')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>1</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('2')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>2</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('3')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>3</KeyText>
                </KeyButton>
              </KeyboardRow>

              <KeyboardRow>
                <KeyButton onPress={() => handleNumberPress('4')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>4</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('5')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>5</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('6')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>6</KeyText>
                </KeyButton>
              </KeyboardRow>

              <KeyboardRow>
                <KeyButton onPress={() => handleNumberPress('7')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>7</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('8')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>8</KeyText>
                </KeyButton>
                <KeyButton onPress={() => handleNumberPress('9')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>9</KeyText>
                </KeyButton>
              </KeyboardRow>

              <KeyboardRow>
                <EmptyButton />
                <ExitButton onPress={handleExitAppWithVibration}>
                  <ExitIcon>
                    <Icon size={ESize.s28} color={Colors.white} name={IconNames.signOut} />
                  </ExitIcon>
                </ExitButton>
                <KeyButton onPress={() => handleNumberPress('0')} disabled={isLocked}>
                  <KeyText disabled={isLocked}>0</KeyText>
                </KeyButton>
                {getActionButton()}
                <EmptyButton />
              </KeyboardRow>
            </KeyboardContainer>
          </MainContainer>
        </>
      )}

      {/* Кастомный алерт компонент - рендерится глобально */}
      <AlertComponent />
    </Container>
  );
});
