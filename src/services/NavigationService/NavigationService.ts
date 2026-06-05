import { RootStackParamList } from '@navigation';
import {
  NavigationAction,
  NavigationContainerRef,
  NavigationState,
  PartialState,
  StackActions,
} from '@react-navigation/native';
import { RefObject } from 'react';
import { CurrentRouteInfo } from './types';

// Объявляем класс
export class NavigationServiceClass {
  private static instance: NavigationServiceClass;

  private navigationRef: RefObject<NavigationContainerRef<RootStackParamList>> | null = null;

  private constructor() {}

  static getInstance(): NavigationServiceClass {
    if (!NavigationServiceClass.instance) {
      NavigationServiceClass.instance = new NavigationServiceClass();
    }
    return NavigationServiceClass.instance;
  }

  // Основной метод навигации

  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      // Использование типизированного подхода
      type NavigateFunction = <T extends keyof RootStackParamList>(
        name: T,
        params?: RootStackParamList[T],
      ) => void;

      const navigateFunc = this.navigationRef.current.navigate as NavigateFunction;
      navigateFunc(name, params);
    } catch (error) {
      console.error('Ошибка навигации:', error);
    }
  }

  dispatch(action: NavigationAction): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.dispatch(action);
    } catch (error) {
      console.error('Ошибка диспетчеризации действия:', error);
    }
  }

  replace<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.dispatch(StackActions.replace(name as string, params));
    } catch (error) {
      console.error('Ошибка при замене экрана:', error);
    }
  }

  push<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.dispatch(StackActions.push(name as string, params));
    } catch (error) {
      console.error('Ошибка при push навигации:', error);
    }
  }

  pop(count = 1): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.dispatch(StackActions.pop(count));
    } catch (error) {
      console.error('Ошибка при pop навигации:', error);
    }
  }

  goBack(): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.goBack();
    } catch (error) {
      console.error('Ошибка при возврате назад:', error);
    }
  }

  reset<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return;
    }

    try {
      this.navigationRef.current.reset({
        index: 0,
        routes: [{ name: name as string, params }],
      });
    } catch (error) {
      console.error('Ошибка сброса навигации:', error);
    }
  }

  private getCurrentRoute(
    state: NavigationState | PartialState<NavigationState>,
  ): CurrentRouteInfo | null {
    if (!state || !state.routes || state.index === undefined) {
      console.warn('Неверное состояние навигации');
      return null;
    }

    const route = state.routes[state.index];

    // Проверяем тип route для TypeScript
    if ('state' in route && route.state) {
      return this.getCurrentRoute(route.state);
    }

    return {
      name: route.name,
      params: 'params' in route ? route.params : undefined,
    };
  }

  getCurrentRouteFromRoot(): CurrentRouteInfo | null {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return null;
    }

    const state = this.navigationRef.current.getRootState();
    return this.getCurrentRoute(state);
  }

  // Дополнительные полезные методы с типизацией

  canGoBack(): boolean {
    if (!this.navigationRef?.current) {
      return false;
    }
    return this.navigationRef.current.canGoBack();
  }

  getCurrentState(): NavigationState | undefined {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен или null');
      return undefined;
    }

    return this.navigationRef.current.getRootState();
  }

  // Метод для безопасного получения параметров экрана
  getCurrentParams<RouteName extends keyof RootStackParamList>():
    | RootStackParamList[RouteName]
    | undefined {
    const route = this.getCurrentRouteFromRoot();
    return route?.params as RootStackParamList[RouteName] | undefined;
  }

  // Альтернативный вариант с более точной типизацией
  getCurrentParamsForScreen<RouteName extends keyof RootStackParamList>(
    screenName?: RouteName,
  ): RootStackParamList[RouteName] | undefined {
    const route = this.getCurrentRouteFromRoot();

    // Если указано имя экрана, проверяем, что текущий экран соответствует
    if (screenName && route?.name !== screenName) {
      return undefined;
    }

    return route?.params as RootStackParamList[RouteName] | undefined;
  }

  // Вспомогательный метод для получения текущего имени экрана
  getCurrentScreenName(): string | undefined {
    const route = this.getCurrentRouteFromRoot();
    return route?.name;
  }

  // Проверка, находимся ли мы на определенном экране
  isCurrentScreen<RouteName extends keyof RootStackParamList>(screenName: RouteName): boolean {
    const currentRoute = this.getCurrentRouteFromRoot();
    return currentRoute?.name === screenName;
  }

  // Вспомогательный метод для безопасного перехода назад
  safeGoBack(): boolean {
    if (this.canGoBack()) {
      this.goBack();
      return true;
    }
    return false;
  }
}

// Экспортируем инстанс как дефолтный экспорт
export default NavigationServiceClass.getInstance();

// Экспорт типа для удобства
export type NavigationServiceType = typeof NavigationServiceClass;
