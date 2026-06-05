import { NavigationServiceClass } from './NavigationService';

// Тип для возвращаемого значения getCurrentRoute
export interface CurrentRouteInfo {
  name: string;
  params?: object;
}

// Экспортируем тип
export type NavigationService = NavigationServiceClass;

// Экспортируем публичный интерфейс
export type NavigationServiceType = NavigationService;

// Экспортируем публичный интерфейс с выбором методов
export type NavigationServicePublicInterface = Pick<
  NavigationServiceClass,
  | 'navigate'
  | 'dispatch'
  | 'replace'
  | 'push'
  | 'pop'
  | 'goBack'
  | 'reset'
  | 'getCurrentRouteFromRoot'
  | 'canGoBack'
  | 'getCurrentState'
  | 'getCurrentParams'
  | 'getCurrentParamsForScreen'
>;
