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

  setNavigationRef(ref: RefObject<NavigationContainerRef<RootStackParamList>> | null): void {
    this.navigationRef = ref;
  }

  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен');
      return;
    }

    try {
      // ✅ Используем as any для обхода строгой типизации navigate
      (this.navigationRef.current.navigate as any)(name, params);
    } catch (error) {
      console.error('Ошибка навигации:', error);
    }
  }

  dispatch(action: NavigationAction): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.current.dispatch(action);
    } catch (error) {
      console.error('Ошибка диспетчеризации:', error);
    }
  }

  replace<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef?.current) {
      console.error('Навигационный референс не установлен');
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
      console.error('Навигационный референс не установлен');
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
      console.error('Навигационный референс не установлен');
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
      console.error('Навигационный референс не установлен');
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
      console.error('Навигационный референс не установлен');
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
    if (!state?.routes || state.index === undefined) {
      return null;
    }

    const route = state.routes[state.index];

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
      return null;
    }

    const state = this.navigationRef.current.getRootState();
    return this.getCurrentRoute(state);
  }

  canGoBack(): boolean {
    return !!this.navigationRef?.current?.canGoBack();
  }

  getCurrentState(): NavigationState | undefined {
    return this.navigationRef?.current?.getRootState();
  }

  getCurrentParams<RouteName extends keyof RootStackParamList>():
    | RootStackParamList[RouteName]
    | undefined {
    const route = this.getCurrentRouteFromRoot();
    return route?.params as RootStackParamList[RouteName] | undefined;
  }

  getCurrentParamsForScreen<RouteName extends keyof RootStackParamList>(
    screenName?: RouteName,
  ): RootStackParamList[RouteName] | undefined {
    const route = this.getCurrentRouteFromRoot();

    if (screenName && route?.name !== screenName) {
      return undefined;
    }

    return route?.params as RootStackParamList[RouteName] | undefined;
  }
}

export default NavigationServiceClass.getInstance();
