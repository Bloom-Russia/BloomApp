import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Block,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  MaskedTimeInput,
  Row,
  Typography,
} from '@UIKit';
import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable } from 'react-native';
import styled from 'styled-components';

type AppointmentTimeProps = {
  title?: string;
  startTime: string;
  finishTime: string;
  setStartTime: (time: string) => void;
  setFinishTime: (time: string) => void;
  setTimeError?: (error: boolean) => void;
  timeErrorText?: string;
  isError?: boolean;
  required?: boolean;
  marginBottom?: ESpacings;
};

const parseTimeFromString = (timeString: string): Date | null => {
  if (!timeString || timeString.length < 5) {
    return null;
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

type TimePickerProps = {
  value: string;
  onChange: (time: string) => void;
  show: boolean;
  setShow: (show: boolean) => void;
};

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, show, setShow }) => {
  const date = parseTimeFromString(value) || new Date();

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      setShow(Platform.OS === 'ios');
      if (selectedDate) {
        onChange(formatTime(selectedDate));
      }
    },
    [onChange, setShow],
  );

  const handleClose = useCallback(() => {
    setShow(false);
  }, [setShow]);

  if (!show) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return (
      <Modal transparent animationType="slide" visible={show} onRequestClose={handleClose}>
        <PressableContainer onPress={handleClose}>
          <Container
            backgroundColor={Colors.white}
            justifyContent="center"
            alignItems="center"
            paddingBottom={ESpacings.s2}
          >
            <HeaderModal padding={ESpacings.s16} justifyContent="flex-end">
              <Pressable onPress={handleClose}>
                <Typography.B16 color={Colors.primary}>Готово</Typography.B16>
              </Pressable>
            </HeaderModal>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              onChange={handleChange}
              themeVariant="light"
              minuteInterval={5}
            />
          </Container>
        </PressableContainer>
      </Modal>
    );
  }

  return (
    <DateTimePicker
      value={date}
      mode="time"
      display="spinner"
      onChange={handleChange}
      themeVariant="light"
      locale={'RU'}
    />
  );
};

export const AppointmentTime: React.FC<AppointmentTimeProps> = ({
  title,
  startTime,
  finishTime,
  setStartTime,
  setFinishTime,
  setTimeError,
  timeErrorText,
  marginBottom = ESpacings.s12,
  isError,
  required,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showFinishPicker, setShowFinishPicker] = useState(false);

  const handleStartTimeChange = useCallback(
    (time: string) => {
      setStartTime(time);
      setTimeError?.(false);
    },
    [setStartTime, setTimeError],
  );

  const handleFinishTimeChange = useCallback(
    (time: string) => {
      setFinishTime(time);
      setTimeError?.(false);
    },
    [setFinishTime, setTimeError],
  );

  const handleStartPickerOpen = useCallback(() => {
    setShowStartPicker(true);
  }, []);

  const handleFinishPickerOpen = useCallback(() => {
    setShowFinishPicker(true);
  }, []);

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
      <Row alignItems="center">
        <TimeInputGroup
          value={startTime}
          onChange={handleStartTimeChange}
          onIconPress={handleStartPickerOpen}
        />
        <Typography.B14 paddingHorizontal={ESpacings.s12} color={Colors.white}>
          -
        </Typography.B14>
        <TimeInputGroup
          value={finishTime}
          onChange={handleFinishTimeChange}
          onIconPress={handleFinishPickerOpen}
        />
      </Row>
      {isError && timeErrorText && (
        <Typography.B14 color={Colors.red} marginTop={ESpacings.s4}>
          {timeErrorText}
        </Typography.B14>
      )}
      <TimePicker
        value={startTime}
        onChange={handleStartTimeChange}
        show={showStartPicker}
        setShow={setShowStartPicker}
      />
      <TimePicker
        value={finishTime}
        onChange={handleFinishTimeChange}
        show={showFinishPicker}
        setShow={setShowFinishPicker}
      />
    </Block>
  );
};

type TimeInputGroupProps = {
  value: string;
  onChange: (time: string) => void;
  onIconPress: () => void;
};

const TimeInputGroup: React.FC<TimeInputGroupProps> = ({ value, onChange, onIconPress }) => (
  <Row alignItems="center">
    <MaskedTimeInput time={value} setTime={onChange} />
    <Block marginLeft={ESpacings.s8}>
      <Pressable onPress={onIconPress}>
        <Icon color={Colors.white} size={ESize.s24} name={IconNames.clock} />
      </Pressable>
    </Block>
  </Row>
);

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
