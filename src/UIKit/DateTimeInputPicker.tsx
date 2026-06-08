import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Block, Colors, ERounding, ESize, ESpacings, Icon, IconNames, Typography } from '@UIKit';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

// Форматирование даты для отображения
const formatDate = (date: Date | null) => {
  if (!date) {
    return 'Выберите дату';
  }
  return date.toLocaleDateString('ru-RU');
};

type Props = {
  date: Date | null;
  setDate: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (showDatePicker: boolean) => void;
  error?: string;
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
  error,
  marginBottom,
  value,
  setValue,
}) => {
  // Обработка изменения даты
  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}

      <Block>
        <StyledMaskInput
          error={!!error}
          color={Colors.white}
          value={date ? formatDate(date) : value}
          onChangeText={(_masked, unmasked) => setValue(unmasked)}
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
      {error ? (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {error}
        </Typography.B14>
      ) : null}
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
  error?: boolean;
}>(({ error, color }) => ({
  borderWidth: 1,
  borderColor: error ? Colors.red : Colors.white,
  borderRadius: ERounding.r14,
  paddingLeft: ESpacings.s16,
  paddingRight: ESpacings.s24,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
