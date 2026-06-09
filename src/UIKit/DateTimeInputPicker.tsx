import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Block, Colors, ERounding, ESize, ESpacings, Icon, IconNames, Typography } from '@UIKit';
import React, { useEffect, useState } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

const formatDate = (date: Date | null): string => {
  if (!date) {
    return '';
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDateFromString = (digits: string): Date | null => {
  if (digits.length !== 8) {
    return null;
  }
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10) - 1;
  const year = parseInt(digits.slice(4, 8), 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return null;
  }
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  if (date > new Date()) {
    return null;
  }
  return date;
};

type Props = {
  date: Date | null;
  setDate: (date: Date | null) => void;
  showDatePicker: boolean;
  setShowDatePicker: (showDatePicker: boolean) => void;
  isError?: boolean;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  value: string; // внешнее значение – используется только для начальной установки
  setValue: (value: string) => void;
};

export const DateTimeInputPicker: React.FC<Props> = ({
  date,
  setDate,
  showDatePicker,
  setShowDatePicker,
  title,
  errorText,
  isError,
  marginBottom,
  value: externalValue,
  setValue: setExternalValue,
}) => {
  // Внутреннее состояние для текста в поле
  const [inputValue, setInputValue] = useState(externalValue || (date ? formatDate(date) : ''));

  // Синхронизация внешнего date с внутренним полем (например, если родитель сбросил дату)
  useEffect(() => {
    if (date) {
      const formatted = formatDate(date);
      if (inputValue !== formatted) {
        setInputValue(formatted);
        setExternalValue(formatted);
      }
    } else if (!inputValue) {
      // если дата null и поле пустое – ничего не делаем
    } else if (!externalValue && inputValue) {
      // частный случай: родитель очистил date, но в поле что-то есть – очищаем
      setInputValue('');
      setExternalValue('');
    }
  }, [date, externalValue, inputValue, setExternalValue]);

  // Если внешнее значение изменилось (например, при сбросе формы) – обновляем внутреннее
  useEffect(() => {
    if (externalValue !== inputValue) {
      setInputValue(externalValue);
    }
  }, [externalValue, inputValue]);

  // Обработка изменения через календарь
  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = formatDate(selectedDate);
      setInputValue(formatted);
      setExternalValue(formatted);
    }
  };

  // Обработка ручного ввода через маску
  const handleTextChange = (masked: string, unmasked: string) => {
    setInputValue(masked); // обновляем отображаемый текст
    setExternalValue(masked); // сообщаем родителю (для валидации и т.п.)

    if (unmasked.length === 8) {
      const parsedDate = parseDateFromString(unmasked);
      if (parsedDate) {
        setDate(parsedDate);
      } else {
        // невалидная дата – сбрасываем date, но текст остается
        setDate(null);
      }
    } else {
      // введено меньше 8 цифр – дата неполная
      setDate(null);
    }
  };

  return (
    <Block marginBottom={marginBottom}>
      {title && (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      )}

      <Block>
        <StyledMaskInput
          isError={isError}
          color={Colors.white}
          value={inputValue}
          onChangeText={handleTextChange}
          mask={[/\d/, /\d/, '.', /\d/, /\d/, '.', /\d/, /\d/, /\d/, /\d/]}
          placeholder="дд.мм.гггг"
          keyboardType="numeric"
          placeholderTextColor={Colors.white}
        />
        <AbsoluteContainer>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Icon color={Colors.white} size={ESize.s24} name={IconNames.calendar} />
          </TouchableOpacity>
        </AbsoluteContainer>
      </Block>

      {showDatePicker && (
        <DateTimePicker
          value={date || new Date(1990, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {isError && (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {errorText}
        </Typography.B14>
      )}
    </Block>
  );
};

const AbsoluteContainer = styled(Block)({
  position: 'absolute',
  top: 12,
  right: 12,
});

const StyledMaskInput = styled(MaskInput)<{
  color: string;
  isError?: boolean;
}>(({ isError, color }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.red : Colors.white,
  borderRadius: ERounding.r14,
  paddingLeft: ESpacings.s16,
  paddingRight: ESpacings.s24,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
