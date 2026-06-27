import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Block, Colors, ERounding, ESize, ESpacings, Icon, IconNames, Typography } from '@UIKit';
import { parseDateFromString } from '@utils';
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

type Props = {
  date: Date | null;
  setDate: (date: Date | null) => void;
  showDatePicker: boolean;
  setShowDatePicker: (showDatePicker: boolean) => void;
  isError?: boolean;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  value: string;
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
  const [inputValue, setInputValue] = useState(externalValue || (date ? formatDate(date) : ''));

  useEffect(() => {
    if (date) {
      const formatted = formatDate(date);
      if (inputValue !== formatted) {
        setInputValue(formatted);
        setExternalValue(formatted);
      }
    } else if (!externalValue && inputValue) {
      setInputValue('');
      setExternalValue('');
    }
  }, [date, externalValue, inputValue, setExternalValue]);

  useEffect(() => {
    if (externalValue !== inputValue) {
      setInputValue(externalValue);
    }
  }, [externalValue, inputValue]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const normalizedDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setDate(normalizedDate);
      const formatted = formatDate(normalizedDate);
      setInputValue(formatted);
      setExternalValue(formatted);
    }
  };

  const handleTextChange = (masked: string, unmasked: string) => {
    setInputValue(masked);
    setExternalValue(masked);

    if (unmasked.length === 8) {
      const parsedDate = parseDateFromString(unmasked);
      setDate(parsedDate || null);
    } else {
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

      {/*{showDatePicker && (*/}
      {/*  <DateTimePicker*/}
      {/*    value={date || parseDateFromString(externalValue) || new Date(1990, 0, 1, 12, 0, 0)}*/}
      {/*    mode="date"*/}
      {/*    display={Platform.OS === 'ios' ? 'spinner' : 'default'}*/}
      {/*    onChange={onDateChange}*/}
      {/*    maximumDate={new Date()}*/}
      {/*  />*/}
      {/*)}*/}

      {isError && errorText && (
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
