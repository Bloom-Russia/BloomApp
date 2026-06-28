import { AppointmentsStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, IconNames, ScreenContainer, Typography } from '@UIKit';
import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';

type AppointmentsScreenComponent = NativeStackScreenProps<
  AppointmentsStackParamList,
  EScreens.APPOINTMENTS_SCREEN
>;

const AppointmentsScreenComponent: React.FC<AppointmentsScreenComponent> = ({ navigation }) => {
  const navigateToCreateAppointment = useCallback(() => {
    navigation.navigate(EScreens.CREATE_APPOINTMENT_SCREEN);
  }, [navigation]);

  return (
    <ScreenContainer
      icon={IconNames.plus}
      onPressIcon={navigateToCreateAppointment}
      title="Записи"
      paddingHorizontal={ESpacings.s16}
      hideBackIcon
    >
      <Block flex={1} justifyContent={'center'}>
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          APPOINTMENTS Screen
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const AppointmentsScreen = memo(AppointmentsScreenComponent, isEqual);
