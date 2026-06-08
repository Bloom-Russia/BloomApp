// components.tsx - Все компоненты для кастомного алерта
import { Block, ERounding, ESize, ESpacings } from '@UIKit';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';

// ==================== КОНСТАНТЫ РАЗМЕРОВ ====================
// Получаем размеры экрана для адаптивного дизайна
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Ширина алерта - 90% ширины экрана, но не более 400px
const ALERT_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);

// ==================== БАЗОВЫЕ КОМПОНЕНТЫ ====================
export const Touchable = styled.TouchableOpacity``;
export const TextBase = styled.Text``;
export const TextInputBase = styled.TextInput``;

// ==================== КОМПОНЕНТЫ ОБЕРТКИ ====================
// Бэкдроп (затемненный фон)
export const Backdrop = styled(Touchable).attrs(() => ({
    activeOpacity: 1, // Без эффекта прозрачности при нажатии
}))(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Полупрозрачный черный фон
}));

// View для бэкдропа
export const BackdropView = styled(Block)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
});

// Оверлей (контейнер для всего алерта)
export const Overlay = styled(Block)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Высокий z-index для отображения поверх всего
});

// ==================== ОСНОВНОЙ КОНТЕЙНЕР АЛЕРТА ====================
// Контейнер алерта
export interface AlertContainerProps {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    shadow?: boolean;
    shadowStyle?: {
        shadowColor?: string;
        shadowOffset?: { width: number; height: number };
        shadowOpacity?: number;
        shadowRadius?: number;
        elevation?: number;
    };
}

export const AlertContainer = styled(Block).attrs(() => ({}))<AlertContainerProps>(
    ({ backgroundColor, borderColor, borderRadius, shadow, shadowStyle }) => ({
        width: ALERT_WIDTH, // Адаптивная ширина
        borderWidth: 1,
        overflow: 'hidden', // Обрезаем содержимое за границами
        padding: ESpacings.s24,
        backgroundColor,
        borderColor,
        borderRadius,
        // Настройки тени для iOS - используем переданные значения или значения по умолчанию
        shadowColor: shadow ? (shadowStyle?.shadowColor || '#000') : 'transparent',
        shadowOffset: shadow
            ? (shadowStyle?.shadowOffset || { width: 0, height: 4 })
            : { width: 0, height: 0 },
        shadowOpacity: shadow ? (shadowStyle?.shadowOpacity || 0.1) : 0,
        shadowRadius: shadow ? (shadowStyle?.shadowRadius || ESize.s12) : 0,
        // Тень для Android
        elevation: shadow ? (shadowStyle?.elevation || 8) : 0,
    }),
);

// ==================== КОМПОНЕНТЫ СОДЕРЖИМОГО ====================
// Контейнер для иконки
export const IconContainer = styled(Block)({
    alignItems: 'center',
    marginBottom: ESpacings.s16, // Отступ снизу для разделения от контента
});

// Контейнер для контента алерта
export const ContentContainer = styled(Block)({
    alignItems: 'center',
});

// Заголовок алерта
interface Title20Props {
    color: string;
    align?: 'left' | 'center' | 'right';
}

export const Title20 = styled(TextBase).attrs(() => ({}))<Title20Props>(
    ({ color, align = 'center' }) => ({
        fontSize: 20,
        fontWeight: '700', // Полужирный шрифт
        lineHeight: 24, // Межстрочный интервал
        marginBottom: ESpacings.s8, // Отступ снизу от сообщения
        color,
        textAlign: align,
    }),
);

// Сообщение алерта
interface MessageProps {
    color: string;
    align?: 'left' | 'center' | 'right';
}

export const Message = styled(TextBase).attrs(() => ({}))<MessageProps>(
    ({ color, align = 'center' }) => ({
        fontSize: 16,
        fontWeight: '400', // Обычный шрифт
        lineHeight: 22, // Межстрочный интервал
        marginBottom: ESpacings.s16, // Отступ снизу для следующего элемента
        color,
        textAlign: align,
    }),
);

// ==================== КОМПОНЕНТЫ ДЛЯ ВВОДА ====================
// Поле ввода для алерта
interface InputFieldProps {
    borderColor: string;
    color: string;
    backgroundColor: string;
}

export const InputField = styled(TextInputBase).attrs(() => ({
    placeholderTextColor: '#999', // Цвет плейсхолдера
}))<InputFieldProps>(({ borderColor, color, backgroundColor }) => ({
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: ERounding.r8,
    paddingHorizontal: 16, // Отступы слева и справа
    fontSize: 16,
    marginBottom: ESpacings.s16, // Отступ снизу
    borderColor,
    color,
    backgroundColor,
}));

// ==================== РАЗДЕЛИТЕЛЬ ====================
// Разделитель между контентом и кнопками
interface DividerProps {
    color: string;
}

export const Divider = styled(Block).attrs(() => ({}))<DividerProps>(({ color }) => ({
    height: 1,
    width: '100%', // Занимает всю ширину
    opacity: 0.2, // Полупрозрачный
    marginVertical: ESpacings.s20, // Отступ сверху и снизу
    backgroundColor: color,
}));

// ==================== КОМПОНЕНТЫ КНОПОК ====================
// Контейнер для иконки кнопки
export const ButtonIcon = styled(Block)({
    marginRight: ESpacings.s8,
});

// Контейнер для кнопок
export const ButtonsContainer = styled(Block)({
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', // Занимает всю ширину родительского контейнера
});

// Стилизованная кнопка для алерта
interface StyledButtonProps {
    backgroundColor: string;
    disabled?: boolean;
    marginLeft?: number;
    showIcon?: boolean;
}

export const StyledButton = styled(Touchable).attrs<StyledButtonProps>(({ disabled }) => ({
    activeOpacity: disabled ? 1 : 0.7,
    disabled,
}))<StyledButtonProps>(({ backgroundColor, disabled, marginLeft = 0, showIcon }) => ({
    flex: 1,
    height: 48,
    backgroundColor: disabled ? '#cccccc' : backgroundColor,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft,
    flexDirection: showIcon ? 'row' : 'column',
}));

// Текст для стилизованной кнопки
interface ButtonTextProps {
    textColor: string;
    disabled?: boolean;
    hasIcon?: boolean;
}

export const ButtonText = styled(TextBase).attrs<ButtonTextProps>(() => ({}))<ButtonTextProps>(
    ({ textColor, disabled, hasIcon = false }) => ({
        fontSize: 16,
        fontWeight: '600',
        color: disabled ? '#666666' : textColor,
        marginLeft: hasIcon ? ESpacings.s4 : 0,
    }),
);
