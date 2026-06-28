import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUserStore } from '@store';
import { Colors, ESize, ESpacings, Icon, IconNames, TAB_BAR_HEIGHT, Typography } from '@UIKit';
import React, { memo, useMemo } from 'react';
import isEqual from 'react-fast-compare';
import { AppointmentsStack } from './AppointmentsStack';
import { ChatStack } from './ChatStack';
import { HomeStack } from './HomeStack';
import { RootTabParamList } from './navigationTypes';
import { ProfileStack } from './ProfileStack';
import { EScreens } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_BAR_STYLE = {
  height: TAB_BAR_HEIGHT,
  backgroundColor: Colors.black,
  borderTopWidth: 1,
  paddingTop: ESpacings.s8,
  paddingBottom: ESpacings.s8,
  borderColor: Colors.white,
} as const;

const SCREEN_OPTIONS = {
  tabBarHideOnKeyboard: true,
  tabBarStyle: TAB_BAR_STYLE,
  tabBarItemStyle: {
    marginBottom: ESize.s20,
  } as const,
  headerShown: false,
  tabBarActiveTintColor: Colors.blue,
  tabBarInactiveTintColor: Colors.white,
} as const;

const TAB_CONFIGS = [
  {
    name: EScreens.HOME_STACK as const,
    component: HomeStack,
    icon: IconNames.home,
    label: 'Главная',
  },
  {
    name: EScreens.CHAT_STACK as const,
    component: ChatStack,
    icon: IconNames.chat,
    label: 'Чат',
  },
  {
    name: EScreens.APPOINTMENTS_STACK as const,
    component: AppointmentsStack,
    icon: IconNames.notebook,
    label: 'Записи',
  },
  {
    name: EScreens.PROFILE_STACK as const,
    component: ProfileStack,
    icon: IconNames.profile,
    label: 'Профиль',
  },
] as const;

const TabBarNavigatorComponent: React.FC = () => {
  const {
    user: { isUserDataComplete },
  } = useUserStore();

  const tabScreens = useMemo(
    () =>
      TAB_CONFIGS.map((config) => ({
        name: config.name,
        component: config.component,
        options: {
          tabBarLabel: ({ color }: { color: string }) => (
            <Typography.R14 color={color}>{config.label}</Typography.R14>
          ),
          tabBarIcon: ({ color }: { color: string }) => (
            <Icon size={ESize.s20} color={color} name={config.icon} />
          ),
        },
      })),
    [],
  );

  return (
    <Tab.Navigator
      screenOptions={SCREEN_OPTIONS}
      initialRouteName={isUserDataComplete ? EScreens.HOME_STACK : EScreens.PROFILE_STACK}
    >
      {tabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Tab.Navigator>
  );
};

TabBarNavigatorComponent.displayName = 'TabBarNavigatorComponent';

export const TabBarNavigator = memo(TabBarNavigatorComponent, isEqual);
