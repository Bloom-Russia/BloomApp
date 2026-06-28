import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Block,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  Row,
  Typography,
} from '@UIKit';
import { parseDateFromString } from '@utils';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable } from 'react-native';
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
  defaultDate?: Date;
  setDate: (date: Date | null) => void;
  showDatePicker: boolean;
  setShowDatePicker: (showDatePicker: boolean) => void;
  isError?: boolean;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  value: string;
  setValue: (value: string) => void;
  maximumDateEnable?: boolean;
  required?: boolean;
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
  maximumDateEnable = true,
  required,
  defaultDate = new Date(2000, 0, 1),
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

  const onRequestClose = useCallback(() => {
    setShowDatePicker(false);
  }, [setShowDatePicker]);

  const onRequestOpen = useCallback(() => {
    setShowDatePicker(true);
  }, [setShowDatePicker]);

  return (
    <Block marginBottom={marginBottom}>
      {title && (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
          {required ? (
            <Typography.B16 color={Colors.red} marginBottom={ESpacings.s8}>
              {` *`}
            </Typography.B16>
          ) : null}
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
          <Pressable onPress={onRequestOpen}>
            <Icon color={Colors.white} size={ESize.s24} name={IconNames.calendar} />
          </Pressable>
        </AbsoluteContainer>
      </Block>
      {showDatePicker ? (
        Platform.OS === 'ios' ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={onRequestClose}
          >
            <PressableContainer onPress={onRequestClose}>
              <Container
                backgroundColor={Colors.white}
                justifyContent="center"
                alignItems="center"
                paddingBottom={ESpacings.s2}
              >
                <HeaderModal padding={ESpacings.s16} justifyContent={'flex-end'}>
                  <Pressable onPress={onRequestClose}>
                    <Typography.B16 color={Colors.primary}>Готово</Typography.B16>
                  </Pressable>
                </HeaderModal>
                <DateTimePicker
                  value={date || parseDateFromString(externalValue) || defaultDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  themeVariant="light"
                  locale={'RU'}
                />
              </Container>
            </PressableContainer>
          </Modal>
        ) : (
          <DateTimePicker
            value={date || parseDateFromString(externalValue) || defaultDate}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            maximumDate={maximumDateEnable ? new Date() : undefined}
            themeVariant="light"
            locale={'RU'}
          />
        )
      ) : null}

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

const PressableContainer = styled(Pressable)({
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
});

const HeaderModal = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: '#E5E5E5',
  width: '100%',
});

const Container = styled(Block)({
  borderTopLeftRadius: ERounding.r20,
  borderTopRightRadius: ERounding.r20,
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
