// ==================== ТИПЫ И ИНТЕРФЕЙСЫ ====================
import { IconNames } from '@UIKit';
import React from 'react';

/**
 * Интерфейс для кнопки алерта
 * @property text - Текст кнопки
 * @property onPress - Обработчик нажатия
 * @property style - Стиль кнопки (default, cancel, destructive)
 * @property disabled - Отключена ли кнопка
 * @property loading - Показывать ли индикатор загрузки
 * @property buttonIconName - Имя иконки для кнопки
 * @property showButtonIcon - Показывать ли иконку на кнопке
 * @property closeOnPress - Закрывать ли алерт при нажатии
 */
export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  buttonIconName?: IconNames | null;
  showButtonIcon?: boolean | null;
  closeOnPress?: boolean;
}

/**
 * Интерфейс для поля ввода в алерте
 * @property placeholder - Подсказка в поле ввода
 * @property value - Значение поля
 * @property secure - Скрывать ли вводимый текст
 * @property keyboardType - Тип клавиатуры
 */
export interface CustomAlertInput {
  placeholder?: string;
  value?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

/**
 * Конфигурация для показа алерта
 * @property title - Заголовок алерта
 * @property message - Сообщение алерта
 * @property type - Тип алерта (info, warning, error, success, question)
 * @property theme - Тема оформления (light или dark)
 * @property buttons - Массив кнопок
 * @property cancelable - Можно ли закрыть алерт по клику на фон
 * @property onDismiss - Обработчик при закрытии
 * @property showIcon - Показывать ли иконку
 * @property showDivider - Показывать ли разделитель
 * @property borderRadius - Радиус скругления углов
 * @property shadow - Показывать ли тень (true/false). По умолчанию true.
 * @property shadowColorDark - Цвет тени для темной темы
 * @property shadowColorLight - Цвет тени для светлой темы
 * @property input - Конфигурация поля ввода
 * @property onInputChange - Обработчик изменения поля ввода
 * @property customBackgroundColor - Кастомный цвет фона
 * @property customAccentColor - Кастомный акцентный цвет
 */
export interface CustomAlertConfig {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'question';
  theme?: 'light' | 'dark';
  buttons?: CustomAlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void | Promise<void>;
  showIcon?: boolean;
  showDivider?: boolean;
  borderRadius?: number;
  shadow?: boolean; // Показывать ли тень. true - показывать, false - скрыть.
  shadowColorDark?: string; // Цвет тени для темной темы
  shadowColorLight?: string; // Цвет тени для светлой темы
  input?: CustomAlertInput;
  onInputChange?: (text: string) => void;
  customBackgroundColor?: string;
  customAccentColor?: string;
}

/**
 * Внутреннее состояние алерта
 * Наследует конфигурацию и добавляет видимость и обязательные поля
 */
export interface CustomAlertState extends Omit<CustomAlertConfig, 'buttons' | 'input'> {
  visible: boolean; // Флаг видимости алерта
  title: string; // Заголовок алерта
  message: string; // Сообщение алерта
  type: Required<CustomAlertConfig>['type']; // Тип алерта с значением по умолчанию
  theme: Required<CustomAlertConfig>['theme']; // Тема с значением по умолчанию
  buttons: CustomAlertButton[]; // Массив кнопок
  cancelable: boolean; // Можно ли закрыть алерт по клику на фон
  showIcon: boolean; // Показывать ли иконку
  showDivider: boolean; // Показывать ли разделитель
  borderRadius: number; // Радиус скругления углов
  shadow: boolean; // Показывать ли тень. true - показывать, false - скрыть.
  shadowColorDark: string; // Цвет тени для темной темы
  shadowColorLight: string; // Цвет тени для светлой темы
  input?: CustomAlertInput; // Конфигурация поля ввода
  onInputChange?: (text: string) => void; // Обработчик изменения поля ввода
  customBackgroundColor?: string; // Кастомный цвет фона
  customAccentColor?: string; // Кастомный акцентный цвет
}

/**
 * Возвращаемый тип хука
 * @property showAlert - Функция для показа алерта
 * @property hideAlert - Функция для скрытия алерта
 * @property alertState - Текущее состояние алерта
 * @property AlertComponent - React компонент алерта
 */
export interface UseCustomAlertReturn {
  showAlert: (config: CustomAlertConfig) => void;
  hideAlert: () => void;
  alertState: CustomAlertState;
  AlertComponent: React.FC;
}

/**
 * Интерфейс для стилей тени
 */
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}
