import type { RootStackParamList } from '@navigation/types';
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
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

  private constructor() {}

  static getInstance(): NavigationServiceClass {
    if (!NavigationServiceClass.instance) {
      NavigationServiceClass.instance = new NavigationServiceClass();
    }
    return NavigationServiceClass.instance;
  }

  setNavigationRef(
    ref:
      | NavigationContainerRef<RootStackParamList>
      | RefObject<NavigationContainerRef<RootStackParamList>>
      | null,
  ): void {
    if (!ref) {
      this.navigationRef = null;
      return;
    }

    // ✅ Проверяем, передан ли RefObject или прямой референс
    if ('current' in ref) {
      this.navigationRef = ref.current;
    } else {
      this.navigationRef = ref;
    }
  }

  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.navigate(name as any, params);
    } catch (error) {
      console.error('[NavigationService] Ошибка навигации:', error);
    }
  }

  dispatch(action: NavigationAction): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.dispatch(action);
    } catch (error) {
      console.error('[NavigationService] Ошибка диспетчеризации:', error);
    }
  }

  replace<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.dispatch(StackActions.replace(name as string, params));
    } catch (error) {
      console.error('[NavigationService] Ошибка при замене экрана:', error);
    }
  }

  push<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.dispatch(StackActions.push(name as string, params));
    } catch (error) {
      console.error('[NavigationService] Ошибка при push навигации:', error);
    }
  }

  pop(count = 1): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.dispatch(StackActions.pop(count));
    } catch (error) {
      console.error('[NavigationService] Ошибка при pop навигации:', error);
    }
  }

  goBack(): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      if (this.navigationRef.canGoBack()) {
        this.navigationRef.goBack();
      } else {
        console.warn('[NavigationService] Нет экранов для возврата');
      }
    } catch (error) {
      console.error('[NavigationService] Ошибка при возврате назад:', error);
    }
  }

  reset<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
  ): void {
    if (!this.navigationRef) {
      console.warn('[NavigationService] Навигационный референс не установлен');
      return;
    }

    try {
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: name as string, params }],
      });
    } catch (error) {
      console.error('[NavigationService] Ошибка сброса навигации:', error);
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
    if (!this.navigationRef) {
      return null;
    }

    const state = this.navigationRef.getRootState();
    return this.getCurrentRoute(state);
  }

  canGoBack(): boolean {
    return this.navigationRef?.canGoBack() || false;
  }

  getCurrentState(): NavigationState | undefined {
    return this.navigationRef?.getRootState();
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

  isReady(): boolean {
    return this.navigationRef?.isReady() || false;
  }
}

export const navigationService = NavigationServiceClass.getInstance();

export default navigationService;
