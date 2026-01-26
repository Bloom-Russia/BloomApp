import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, ESize, ESpacings, Icon, IconNames, TAB_BAR_HEIGHT, Typography } from '@UIKit';
import React, { memo, useMemo } from 'react';
import isEqual from 'react-fast-compare';
import { ProfileStack } from 'src/navigation/ProfileStack';
import { ChatStack } from './ChatStack';
import { HomeStack } from './HomeStack';
import { MyWorksStack } from './MyWorksStack';
import { RootTabParamList } from './navigationTypes';
import { EScreens } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

// Константы вынесены за пределы компонента
const TAB_BAR_STYLE = {
  height: TAB_BAR_HEIGHT,
  backgroundColor: Colors.black,
  borderTopWidth: 0,
  paddingTop: ESpacings.s8,
  paddingBottom: ESpacings.s8,
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

// Конфигурация табов с предварительно созданными компонентами
const TAB_CONFIGS = [
  {
    name: EScreens.HOME_STACK as const,
    component: HomeStack,
    icon: IconNames.success,
    label: 'Главная',
  },
  {
    name: EScreens.CHAT_STACK as const,
    component: ChatStack,
    icon: IconNames.warning,
    label: 'Чат',
  },
  {
    name: EScreens.MY_WORKS_STACK as const,
    component: MyWorksStack,
    icon: IconNames.reload,
    label: 'Записи',
  },
  {
    name: EScreens.PROFILE_STACK as const,
    component: ProfileStack,
    icon: IconNames.info,
    label: 'Профиль',
  },
] as const;

// Основной компонент
const TabBarNavigatorComponent: React.FC = () => {
  // Мемоизированный массив таб-скринов
  const tabScreens = useMemo(
    () =>
      TAB_CONFIGS.map((config) => ({
        name: config.name,
        component: config.component,
        options: {
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarLabel: ({ color }: { color: string }) => (
            <Typography.R14 color={color}>{config.label}</Typography.R14>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color }: { color: string }) => (
            <Icon size={ESize.s20} color={color} name={config.icon} />
          ),
        },
      })),
    [],
  );

  return (
    <Tab.Navigator screenOptions={SCREEN_OPTIONS} initialRouteName={EScreens.HOME_STACK}>
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
