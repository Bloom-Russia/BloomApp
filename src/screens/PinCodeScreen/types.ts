// Types
import React from 'react';
import { AlertButton } from 'react-native';

// Импортируем типы из constants.ts
import {
  ALERT_CONFIG,
  ERROR_MESSAGES,
  PIN_CONFIG,
  PIN_TITLES,
  UI_TEXT,
  WEAK_PINS,
} from './constants';

// Типы режимов работы с PIN-кодом
export type PinMode = 'enter' | 'set' | 'confirm';

// Тип для пропсов компонента кнопки
export interface KeyButtonProps {
  onPress: () => void;
  disabled: boolean;
  children?: React.ReactNode;
}

// Тип для пропсов текста кнопки
export interface KeyTextProps {
  disabled: boolean;
  children?: React.ReactNode;
}

// Тип для пропсов иконки
export interface IconProps {
  disabled: boolean;
  children?: React.ReactNode;
}

// Тип для компонента точки PIN-кода
export interface PinDotProps {
  filled: boolean;
  children?: React.ReactNode;
}

export interface RenderHelpersProps {
  pinMode: 'enter' | 'set' | 'confirm';
  currentPin: string;
  confirmPin: string;
  isLocked: boolean;
  biometricAvailable: boolean;
  hasEnteredSymbols: boolean;
  handleBiometricAuthWhenLockedWithVibration: () => Promise<void>;
  handleDeletePress: () => void;
  handleBiometricAuthWithVibration: () => Promise<void>;
  PIN_CONFIG: {
    LENGTH: number;
  };
}

// ============================================
// ТИПЫ НА ОСНОВЕ КОНСТАНТ
// ============================================

// Типы для слабых PIN-кодов
export type SequentialWeakPin = (typeof WEAK_PINS.SEQUENTIAL)[number];
export type CommonWeakPin = (typeof WEAK_PINS.COMMON)[number];
export type WeakPin = SequentialWeakPin | CommonWeakPin;
export type AllWeakPins = (typeof WEAK_PINS.ALL)[number];

// Типы для конфигураций
export type PinConfigType = typeof PIN_CONFIG;
export type PinModeKey = keyof typeof PIN_TITLES;
export type AlertConfigType = typeof ALERT_CONFIG;
export type ErrorMessagesType = typeof ERROR_MESSAGES;
export type UIMessagesType = typeof UI_TEXT;

// Объединяем два дублирующихся интерфейса в один
export interface BiometricError {
  errorCode?: string;
  errorMessage?: string;
  code?: string;
  message?: string;
  details?: {
    code?: string;
  };
}

// Тип для настроек биометрии
export interface BiometricSettings {
  isEnabled: boolean;
  lastUsed?: number;
  declined?: boolean; // Пользователь отказался от предложения
}

export interface CustomAlertButton extends AlertButton {
  iconName?: string;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertConfig {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  theme?: 'light' | 'dark';
  animated?: boolean;
  buttons?: CustomAlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface CustomAlertState extends CustomAlertConfig {
  visible: boolean;
}

export interface UseCustomAlertReturn {
  showAlert: (config: CustomAlertConfig) => void;
  hideAlert: () => void;
  alertState: CustomAlertState;
  AlertComponent: React.FC;
}
