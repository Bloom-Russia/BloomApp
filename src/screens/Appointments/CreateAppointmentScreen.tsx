import { AppointmentsStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Block,
  Colors,
  DateTimeInputPicker,
  ESpacings,
  Input,
  MaskedPhoneInput,
  MaskedTimeInput,
  Row,
  ScreenContainer,
  Typography,
} from '@UIKit';
import React, { memo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { TextInput, View } from 'react-native';

type CreateAppointmentScreenProps = NativeStackScreenProps<
  AppointmentsStackParamList,
  EScreens.CREATE_APPOINTMENT_SCREEN
>;

const CreateAppointmentScreenComponent: React.FC<CreateAppointmentScreenProps> = () => {
  const firstNameRef = useRef<View>(null);
  const phoneRef = useRef<View>(null);
  const appointmentDateRef = useRef<View>(null);
  const timeInputRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [appointmentDay, setAppointmentDay] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [finishTime, setFinishTime] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [firstNameError, setFirstNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [appointmentError, setAppointmentError] = useState(false);
  const [timeError, setTimeError] = useState(false);

  // const validateTime = (time: string): boolean => {
  //   if (time.length < 5) {
  //     return false;
  //   }
  //   const [hours, minutes] = time.split(':').map(Number);
  //   return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  // };

  return (
    <ScreenContainer title="Создание записи" paddingHorizontal={ESpacings.s16}>
      <Block flex={1}>
        <View ref={firstNameRef}>
          <Input
            placeholder="Имя"
            autoCapitalize="sentences"
            value={firstName}
            onChangeValue={(v) => {
              setFirstName(v);
              setFirstNameError(false);
            }}
            title="Имя"
            marginBottom={ESpacings.s12}
            errorText="Введите имя"
            isError={firstNameError}
            autoComplete="name"
          />
        </View>

        <Input
          placeholder="Фамилия"
          autoCapitalize="sentences"
          value={lastName}
          onChangeValue={(v) => {
            setLastName(v);
          }}
          title="Фамилия"
          marginBottom={ESpacings.s12}
          autoComplete="family-name"
        />

        <View ref={phoneRef}>
          <MaskedPhoneInput
            title="Телефон"
            phone={phone}
            setPhone={(v) => {
              setPhone(v);
              setPhoneError(false);
            }}
            marginBottom={ESpacings.s12}
            errorText="Введите корректный номер телефона"
            isError={phoneError}
            autoComplete="tel"
          />
        </View>

        <View ref={appointmentDateRef}>
          <DateTimeInputPicker
            date={appointmentDate}
            setDate={(d) => {
              setAppointmentDate(d);
              setAppointmentError(false);
            }}
            setShowDatePicker={setShowDatePicker}
            showDatePicker={showDatePicker}
            title="Дата"
            errorText="Введите дату"
            marginBottom={ESpacings.s12}
            value={appointmentDay}
            setValue={setAppointmentDay}
            isError={appointmentError}
            maximumDateEnable={false}
            defaultDate={new Date()}
          />
        </View>

        <View ref={timeInputRef}>
          <Block marginBottom={ESpacings.s12}>
            <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
              Время
            </Typography.B14>
            <Row alignItems={'center'}>
              <Typography.B14 marginRight={ESpacings.s12} color={Colors.white}>
                с
              </Typography.B14>
              <MaskedTimeInput
                time={startTime}
                setTime={(v) => {
                  setStartTime(v);
                  setTimeError(false);
                }}
              />
              <Typography.B14 paddingHorizontal={ESpacings.s12} color={Colors.white}>
                до
              </Typography.B14>
              <MaskedTimeInput
                time={finishTime}
                setTime={(v) => {
                  setFinishTime(v);
                  setTimeError(false);
                }}
              />
            </Row>
            {timeError && (
              <Typography.B14 color={Colors.red} marginTop={ESpacings.s4}>
                Введите корректное время (00:00 - 23:59)
              </Typography.B14>
            )}
          </Block>
        </View>
      </Block>
    </ScreenContainer>
  );
};

export const CreateAppointmentScreen = memo(CreateAppointmentScreenComponent, isEqual);
