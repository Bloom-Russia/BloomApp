// useCustomAlert.tsx
import { Colors, ESize, Icon, IconNames } from '@UIKit';
import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertContainer,
  Backdrop,
  BackdropView,
  ButtonIcon,
  ButtonsContainer,
  ButtonText,
  ContentContainer,
  Divider,
  IconContainer,
  InputField,
  Message,
  Overlay,
  StyledButton,
  Title20,
} from './components';
import { COLORS, SPACING } from './constans';
import {
  CustomAlertButton,
  CustomAlertConfig,
  CustomAlertState,
  ShadowStyle,
  UseCustomAlertReturn,
} from './types';

/**
 * Альтернативный стиль с двойной тенью для еще большей насыщенности
 */
const getDoubleShadowStyles = (shadowColor: string): ShadowStyle => ({
  shadowColor,
  shadowOffset: {
    width: 0,
    height: 6, // Еще больше высота
  },
  shadowOpacity: 1.0, // Полностью непрозрачная тень
  shadowRadius: 0, // Нулевое размытие - самая четкая тень
  elevation: 20, // Максимальная насыщенность для Android
});

/**
 * Функция для затемнения цвета на 25%
 * Без использования битовых операций для соответствия правилу ESLint
 */
const darkenColor = (color: string, percent: number = 25): string => {
  if (!color.startsWith('#')) {
    return color;
  }

  try {
    // Извлекаем компоненты цвета
    const hex = color.slice(1);
    const num = parseInt(hex, 16);

    if (isNaN(num)) {
      return color;
    }

    // Получаем компоненты RGB без битовых операций
    const r = Math.floor(num / 65536); // Эквивалент num >> 16
    const g = Math.floor((num % 65536) / 256); // Эквивалент (num >> 8) & 0xFF
    const b = num % 256; // Эквивалент num & 0xFF

    // Вычисляем затемнение
    const amount = Math.round(2.55 * percent);
    const newR = Math.max(0, Math.min(255, r - amount));
    const newG = Math.max(0, Math.min(255, g - amount));
    const newB = Math.max(0, Math.min(255, b - amount));

    // Формируем новый hex цвет
    const newHex = (newR * 65536 + newG * 256 + newB).toString(16).padStart(6, '0');
    return `#${newHex}`;
  } catch {
    return color;
  }
};

// ==================== ХУК useCustomAlert ====================
/**
 * Хук для создания и управления кастомным алертом
 * @returns Объект с методами управления алертом и компонентом для рендеринга
 */
export const useCustomAlert = (): UseCustomAlertReturn => {
  // ==================== СОСТОЯНИЕ ====================
  /**
   * Состояние алерта со значениями по умолчанию
   */
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false, // Алерт изначально скрыт
    title: '', // Пустой заголовок по умолчанию
    message: '', // Пустое сообщение по умолчанию
    type: 'info', // Тип по умолчанию - информация
    theme: 'dark', // Тема по умолчанию - темная
    buttons: [], // Пустой массив кнопок по умолчанию
    cancelable: true, // Можно закрыть по умолчанию
    showIcon: true, // Показывать иконку по умолчанию
    showDivider: true, // Показывать разделитель по умолчанию
    borderRadius: 16, // Радиус скругления по умолчанию
    shadow: true, // Показывать тень по умолчанию (true)
    shadowColorDark: COLORS.SHADOW_RED_DARK, // Цвет тени по умолчанию для темной темы
    shadowColorLight: COLORS.SHADOW_RED_LIGHT, // Цвет тени по умолчанию для светлой темы
    input: undefined, // Поле ввода не задано по умолчанию
    onInputChange: undefined, // Обработчик изменения поля не задан
    customBackgroundColor: undefined, // Кастомный цвет фона не задан
    customAccentColor: undefined, // Кастомный акцентный цвет не задан
  });

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  /**
   * Получение цветовой схемы по типу алерта
   * Каждый тип алерта имеет свою цветовую палитру
   *
   * @param type - Тип алерта (info, warning, error, success, question)
   * @returns Объект с цветами для указанного типа
   */
  const getAlertColors = useCallback((type: CustomAlertConfig['type'] = 'info') => {
    const colors = {
      info: {
        backgroundColor: '#1a1a2e',
        accentColor: '#4cc9f0',
        textColor: COLORS.WHITE,
        borderColor: '#16213e',
        iconColor: '#4cc9f0',
        iconName: IconNames.info, // Иконка информации
      },
      warning: {
        backgroundColor: '#2d2424',
        accentColor: '#ff9a00',
        textColor: COLORS.WHITE,
        borderColor: '#4a3a3a',
        iconColor: '#ff9a00',
        iconName: IconNames.warning, // Иконка предупреждения
      },
      error: {
        backgroundColor: COLORS.BLACK,
        accentColor: '#ff4757',
        textColor: COLORS.WHITE,
        borderColor: '#4a2a2a',
        iconColor: '#ff4757',
        iconName: IconNames.error, // Иконка ошибки
      },
      success: {
        backgroundColor: '#1b2d1b',
        accentColor: '#2ed573',
        textColor: COLORS.WHITE,
        borderColor: '#2a4a2a',
        iconColor: '#2ed573',
        iconName: IconNames.success, // Иконка успеха
      },
      question: {
        backgroundColor: '#1a1a2e',
        accentColor: '#9d4edd',
        textColor: COLORS.WHITE,
        borderColor: '#16213e',
        iconColor: '#9d4edd',
        iconName: IconNames.warning, // Иконка вопроса
      },
    };

    // Возвращаем цвета для указанного типа или для info по умолчанию
    return colors[type] || colors.info;
  }, []);

  /**
   * Получение цветов темы (светлая/темная)
   * Преобразует базовые цвета типа в цвета соответствующей темы
   *
   * @param theme - Тема (light или dark)
   * @param typeColors - Цвета типа алерта из getAlertColors
   * @returns Объект с цветами для указанной темы
   */
  const getThemeColors = useCallback(
    (theme: 'light' | 'dark', typeColors: ReturnType<typeof getAlertColors>) => {
      if (theme === 'light') {
        // Для светлой темы используем светлые цвета
        return {
          backgroundColor: COLORS.WHITE, // Белый фон для светлой темы
          borderColor: COLORS.GRAY_MEDIUM, // Серая рамка для светлой темы
          textColor: COLORS.GRAY_DARK, // Темно-серый текст для светлой темы
          accentColor: typeColors.accentColor, // Акцентный цвет остается из типа
          iconColor: typeColors.iconColor, // Цвет иконки остается из типа
        };
      }

      // Для темной темы используем цвета из типа алерта
      return {
        backgroundColor: typeColors.backgroundColor, // Фон из типа алерта
        borderColor: typeColors.borderColor, // Цвет рамки из типа алерта
        textColor: typeColors.textColor, // Цвет текста из типа алерта
        accentColor: typeColors.accentColor, // Акцентный цвет из типа алерта
        iconColor: typeColors.iconColor, // Цвет иконки из типа алерта
      };
    },
    [],
  );

  // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================
  /**
   * Показать алерт с заданной конфигурацией
   * Устанавливает все параметры алерта и делает его видимым
   *
   * @param config - Конфигурация алерта
   */
  const showAlert = useCallback((config: CustomAlertConfig): void => {
    // Сохраняем переданные значения для showButtonIcon и buttonIconName (включая null)
    const buttonsWithDefaults =
      config.buttons?.map((button) => ({
        ...button,
        showButtonIcon: button.showButtonIcon ?? null, // Сохраняем null если передан null
        buttonIconName: button.buttonIconName ?? null, // Сохраняем null если передан null
      })) || [];

    setAlertState((prev) => ({
      ...prev,
      visible: true, // Делаем алерт видимым
      title: config.title || '', // Устанавливаем заголовок или пустую строку
      message: config.message || '', // Устанавливаем сообщение или пустую строку
      type: config.type || 'info', // Устанавливаем тип или значение по умолчанию
      theme: config.theme || 'dark', // Устанавливаем тему или значение по умолчанию
      buttons: buttonsWithDefaults, // Устанавливаем кнопки с сохранением значений
      cancelable: config.cancelable !== false, // По умолчанию можно закрывать
      onDismiss: config.onDismiss, // Колбэк при закрытии
      showIcon: config.showIcon !== false, // По умолчанию показываем иконку
      showDivider: config.showDivider !== false, // По умолчанию показываем разделитель
      borderRadius: config.borderRadius || 16, // Радиус или значение по умолчанию
      shadow: config.shadow !== false, // Показывать тень по умолчанию (true), если false - тень скрывается
      shadowColorDark: config.shadowColorDark || COLORS.SHADOW_RED_DARK, // Цвет тени для темной темы или значение по умолчанию
      shadowColorLight: config.shadowColorLight || COLORS.SHADOW_RED_LIGHT, // Цвет тени для светлой темы или значение по умолчанию
      input: config.input, // Конфигурация поля ввода
      onInputChange: config.onInputChange, // Обработчик изменения поля ввода
      customBackgroundColor: config.customBackgroundColor, // Кастомный цвет фона
      customAccentColor: config.customAccentColor, // Кастомный акцентный цвет
    }));
  }, []);

  /**
   * Скрыть алерт
   * Просто устанавливает visible в false
   */
  const hideAlert = useCallback((): void => {
    setAlertState((prev) => ({ ...prev, visible: false })); // Скрываем алерт
  }, []);

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
  /**
   * Обработчик нажатия на фон (бекдроп)
   * Закрывает алерт, если он cancelable
   */
  const handleBackdropPress = useCallback((): void => {
    if (alertState.cancelable) {
      hideAlert(); // Скрываем алерт
      alertState.onDismiss?.(); // Вызываем колбэк при закрытии
    }
  }, [alertState, hideAlert]);

  /**
   * Обработчик нажатия на кнопку алерта
   * Выполняет пользовательский обработчик и закрывает алерт если нужно
   *
   * @param button - Конфигурация нажатой кнопки
   */
  const handleButtonPress = useCallback(
    (button: CustomAlertButton): void => {
      // Выполняем пользовательский обработчик
      button.onPress?.();

      // Закрываем алерт, если не указано обратное
      if (button.closeOnPress !== false) {
        hideAlert(); // Скрываем алерт после нажатия
      }
    },
    [hideAlert],
  );

  // ==================== КОМПОНЕНТ АЛЕРТА ====================
  /**
   * Компонент алерта
   * Мемоизирован для предотвращения лишних ререндеров
   * Рендерится только когда visible = true
   */
  const AlertComponent = useMemo(() => {
    const Component: React.FC = () => {
      // Не рендерим ничего, если алерт не видим
      if (!alertState.visible) {
        return null; // Возвращаем null если алерт скрыт
      }

      // Получаем цвета для текущего типа алерта
      const typeColors = getAlertColors(alertState.type);

      // Получаем цвета для текущей темы
      const themeColors = getThemeColors(alertState.theme, typeColors);

      // Используем кастомные цвета если они заданы, иначе цвета темы
      const backgroundColor = alertState.customBackgroundColor || themeColors.backgroundColor;
      const accentColor = alertState.customAccentColor || themeColors.accentColor;
      const iconColor = alertState.customAccentColor || themeColors.iconColor;

      // Определяем цвет тени в зависимости от темы
      const shadowColor =
        alertState.theme === 'light' ? alertState.shadowColorLight : alertState.shadowColorDark;

      // Создаем стиль тени - используем getDoubleShadowStyles для максимальной четкости
      const shadowStyle = alertState.shadow ? getDoubleShadowStyles(shadowColor) : undefined;

      // Определяем, нужно ли показывать разделитель
      // Разделитель показывается только если есть кнопки и включен showDivider
      const showDivider =
        alertState.showDivider && alertState.buttons && alertState.buttons.length > 0;

      // ==================== КОНСТАНТЫ СТИЛЕЙ ====================
      // Вынесены в константы для соответствия правилу ESLint no-inline-styles
      const styles = {
        // Стиль заголовка
        title: {
          marginBottom: SPACING.XS, // Отступ снизу для заголовка
        } as const,

        // Стиль сообщения (динамический отступ в зависимости от наличия поля ввода)
        message: {
          marginBottom: alertState.input ? SPACING.SM : SPACING.MD, // Больший отступ если нет поля ввода
        } as const,

        // Стиль поля ввода
        input: {
          borderColor: accentColor, // Цвет рамки поля ввода
          color: themeColors.textColor, // Цвет текста поля ввода
          backgroundColor:
            themeColors.backgroundColor === COLORS.WHITE
              ? COLORS.GRAY_LIGHT // Светло-серый фон для светлой темы
              : COLORS.SEMI_TRANSPARENT_WHITE, // Полупрозрачный белый для темной
          marginBottom: SPACING.MD, // Отступ снизу для поля ввода
        } as const,

        /**
         * Функция для получения стиля кнопки
         * @param index - Индекс кнопки в массиве
         * @returns Объект стиля для кнопки
         */
        getButtonMargin: (index: number): number => (index > 0 ? SPACING.XS : 0), // Отступ слева для всех кнопок кроме первой
      };

      return (
        <Overlay>
          {/* Бекдроп (фон) для закрытия алерта по нажатию */}
          <Backdrop onPress={handleBackdropPress}>
            <BackdropView />
          </Backdrop>

          {/* Основной контейнер алерта */}
          <AlertContainer
            backgroundColor={backgroundColor}
            borderColor={themeColors.borderColor}
            borderRadius={alertState.borderRadius}
            shadow={alertState.shadow} // Передаем параметр shadow в компонент
            shadowStyle={shadowStyle} // Передаем стиль тени с выбранным цветом
          >
            {/* Иконка алерта (если включена) */}
            {alertState.showIcon && (
              <IconContainer>
                <Icon size={ESize.s48} color={iconColor} name={typeColors.iconName} />
              </IconContainer>
            )}

            {/* Контейнер с контентом алерта */}
            <ContentContainer>
              {/* Заголовок алерта */}
              {!!alertState.title && (
                <Title20 color={accentColor} align="center" style={styles.title}>
                  {alertState.title}
                </Title20>
              )}

              {/* Сообщение алерта */}
              {!!alertState.message && (
                <Message color={themeColors.textColor} align="center" style={styles.message}>
                  {alertState.message}
                </Message>
              )}

              {/* Поле ввода (если задано) */}
              {alertState.input && (
                <InputField
                  placeholder={alertState.input.placeholder}
                  value={alertState.input.value}
                  onChangeText={alertState.onInputChange}
                  secureTextEntry={alertState.input.secure}
                  keyboardType={alertState.input.keyboardType}
                  autoCapitalize="none"
                  borderColor={styles.input.borderColor}
                  color={styles.input.color}
                  backgroundColor={styles.input.backgroundColor}
                  style={{ marginBottom: styles.input.marginBottom }}
                />
              )}

              {/* Разделитель между контентом и кнопками */}
              {showDivider && <Divider color={themeColors.borderColor} />}

              {/* Контейнер с кнопками */}
              {alertState.buttons && alertState.buttons.length > 0 && (
                <ButtonsContainer>
                  {alertState.buttons.map((button, index) => {
                    // Определяем тип кнопки
                    const isDestructive = button.style === 'destructive'; // Деструктивная кнопка
                    const isCancel = button.style === 'cancel'; // Кнопка отмены

                    // Определяем цвет и текст кнопки в зависимости от типа
                    let buttonColor = accentColor; // Цвет кнопки по умолчанию
                    let textColor = Colors.white; // Цвет текста по умолчанию

                    if (isCancel) {
                      // Кнопка отмены - темно-серый цвет (на 25% темнее)
                      buttonColor = darkenColor(COLORS.GRAY_CANCEL, 25);
                      textColor = Colors.white;
                    } else if (isDestructive) {
                      // Деструктивная кнопка - красный цвет
                      buttonColor = COLORS.RED_DESTRUCTIVE;
                      textColor = Colors.white;
                    } else {
                      // Кнопка по умолчанию - акцентный цвет
                      buttonColor = accentColor;
                      textColor = Colors.white;
                    }

                    // Определяем, нужно ли показывать иконку (только если явно true)
                    const showIcon = button.showButtonIcon === true;
                    // Используем переданную иконку только если она есть
                    const buttonIconName = button.buttonIconName || null;

                    return (
                      <StyledButton
                        key={index}
                        backgroundColor={buttonColor}
                        disabled={button.disabled || false}
                        marginLeft={styles.getButtonMargin(index)}
                        onPress={() => handleButtonPress(button)}
                        showIcon={showIcon}
                      >
                        {showIcon && buttonIconName && (
                          <ButtonIcon>
                            <Icon size={ESize.s20} color={textColor} name={buttonIconName} />
                          </ButtonIcon>
                        )}
                        <ButtonText
                          textColor={textColor}
                          disabled={button.disabled || false}
                          hasIcon={showIcon && !!buttonIconName}
                        >
                          {button.text}
                        </ButtonText>
                      </StyledButton>
                    );
                  })}
                </ButtonsContainer>
              )}
            </ContentContainer>
          </AlertContainer>
        </Overlay>
      );
    };

    return Component; // Возвращаем созданный компонент
  }, [alertState, getAlertColors, getThemeColors, handleBackdropPress, handleButtonPress]);

  // ==================== ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ ====================
  return {
    showAlert, // Функция для показа алерта
    hideAlert, // Функция для скрытия алерта
    alertState, // Текущее состояние алерта
    AlertComponent, // React компонент алерта
  };
};
