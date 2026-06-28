import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppointmentsScreen, CreateAppointmentScreen } from '@screens';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { AppointmentsStackParamList, AppointmentsStackProps } from 'src/navigation/navigationTypes';
import { EScreens } from './types';

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

const Appointments: React.FC<AppointmentsStackProps> = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName={EScreens.APPOINTMENTS_SCREEN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={EScreens.APPOINTMENTS_SCREEN} component={AppointmentsScreen} />
        <Stack.Screen
          name={EScreens.CREATE_APPOINTMENT_SCREEN}
          component={CreateAppointmentScreen}
        />
      </Stack.Navigator>
    </>
  );
};

export const AppointmentsStack = memo(Appointments, isEqual);
