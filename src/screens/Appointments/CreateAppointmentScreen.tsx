import { AppointmentsStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Block,
  Colors,
  DateTimeInputPicker,
  ERounding,
  ESize,
  ESpacings,
  Input,
  MaskedInput,
  Row,
  ScreenContainer,
  Typography,
} from '@UIKit';
import React, { memo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { View } from 'react-native';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

type CreateAppointmentScreenProps = NativeStackScreenProps<
  AppointmentsStackParamList,
  EScreens.CREATE_APPOINTMENT_SCREEN
>;

const CreateAppointmentScreenComponent: React.FC<CreateAppointmentScreenProps> = () => {
  const firstNameRef = useRef<View>(null);
  const phoneRef = useRef<View>(null);
  const appointmentDateRef = useRef<View>(null);

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
  const [timeError, _setTimeError] = useState(false);

  const handleFinishTimeChange = (masked: string, _unmasked: string) => {
    setFinishTime(masked);
  };

  const handleStartTimeChange = (masked: string, _unmasked: string) => {
    setStartTime(masked);
  };

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
          <MaskedInput
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

        <Block marginBottom={ESpacings.s12}>
          <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
            Время
          </Typography.B14>
          <Row alignItems={'center'}>
            <Typography.B14 marginRight={ESpacings.s12} color={Colors.white}>
              с
            </Typography.B14>
            <StyledMaskInput
              isError={timeError}
              color={Colors.white}
              value={startTime}
              onChangeText={handleStartTimeChange}
              mask={[/[0-2]/, /[0-3]/, ':', /[0-5]/, /[0-9]/]}
              placeholder="чч:мм"
              keyboardType="numeric"
              placeholderTextColor={Colors.white}
            />
            <Typography.B14 paddingHorizontal={ESpacings.s12} color={Colors.white}>
              до
            </Typography.B14>
            <StyledMaskInput
              isError={timeError}
              color={Colors.white}
              value={finishTime}
              onChangeText={handleFinishTimeChange}
              mask={[/[0-2]/, /[0-3]/, ':', /[0-5]/, /[0-9]/]}
              placeholder="чч:мм"
              keyboardType="numeric"
              placeholderTextColor={Colors.white}
            />
          </Row>
        </Block>
      </Block>
    </ScreenContainer>
  );
};

export const CreateAppointmentScreen = memo(CreateAppointmentScreenComponent, isEqual);

const StyledMaskInput = styled(MaskInput)<{
  color: string;
  isError?: boolean;
}>(({ isError, color }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.red : Colors.white,
  borderRadius: ERounding.r14,
  paddingLeft: ESpacings.s16,
  paddingRight: ESpacings.s16,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
