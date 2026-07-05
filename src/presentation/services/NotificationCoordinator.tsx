import { useStores } from '@app/providers';
import { noop } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { NotificationPayload, UnifiedNotificationService } from './UnifiedNotificationService';

interface NotificationCoordinatorProps {
  onNotificationReceived?: (notification: NotificationPayload) => void;
}

export const NotificationCoordinator: React.FC<NotificationCoordinatorProps> = observer(
  ({ onNotificationReceived }) => {
    const { notificationStore } = useStores();

    const appState = useRef(AppState.currentState);
    const nativeEventEmitter = useRef<NativeEventEmitter | null>(null);
    const setupCompleteRef = useRef(false);
    const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(
      null,
    );
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (Platform.OS === 'ios' && NativeModules.RCTDeviceEventEmitter) {
        nativeEventEmitter.current = new NativeEventEmitter(NativeModules.RCTDeviceEventEmitter);
      }

      return () => {
        if (nativeEventEmitter.current) {
          nativeEventEmitter.current.removeAllListeners('DataUpdated');
        }
      };
    }, []);

    const handleAppStateChange = useCallback(
      async (nextAppState: AppStateStatus) => {
        const isBackgroundToActive =
          appState.current.match(/inactive|background/) && nextAppState === 'active';

        if (isBackgroundToActive && Platform.OS === 'ios') {
          const badgeCount = await notificationStore.getBadgeCount();
          await notificationStore.updateBadgeCount(badgeCount);
        }

        appState.current = nextAppState;
      },
      [notificationStore],
    );

    const handleNotification = useCallback(
      async (notification: NotificationPayload) => {
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }

        await notificationStore.handleNotification(notification);
      },
      [notificationStore, onNotificationReceived],
    );

    const setupNotificationHandler = useCallback((): void => {
      if (setupCompleteRef.current) {
        return;
      }

      unsubscribeRef.current = UnifiedNotificationService.subscribe(handleNotification);
      setupCompleteRef.current = true;
    }, [handleNotification]);

    const setupIOSSilentPushHandler = useCallback((): (() => void) => {
      if (Platform.OS !== 'ios' || !nativeEventEmitter.current) {
        return () => {};
      }

      const handler = async () => {
        const badgeCount = await notificationStore.getBadgeCount();
        await notificationStore.updateBadgeCount(badgeCount);
      };

      const subscription = nativeEventEmitter.current.addListener('DataUpdated', handler);
      return () => subscription.remove();
    }, [notificationStore]);

    const initializeServices = useCallback(async (): Promise<() => void> => {
      try {
        await UnifiedNotificationService.initialize();
        setupNotificationHandler();

        if (Platform.OS === 'ios') {
          return setupIOSSilentPushHandler();
        }

        return () => {};
      } catch (error) {
        console.error('Failed to initialize notification services:', error);
        return () => {};
      }
    }, [setupNotificationHandler, setupIOSSilentPushHandler]);

    useEffect(() => {
      let isMounted = true;
      let iosCleanup: (() => void) | undefined;

      const init = async () => {
        if (!isMounted) {
          return;
        }
        iosCleanup = await initializeServices();
      };

      init().then(noop);

      appStateSubscriptionRef.current = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        isMounted = false;

        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }

        if (iosCleanup) {
          iosCleanup();
        }

        if (appStateSubscriptionRef.current) {
          appStateSubscriptionRef.current.remove();
        }

        setupCompleteRef.current = false;
        notificationStore.resetState();
      };
    }, [initializeServices, handleAppStateChange, notificationStore]);

    return null;
  },
);
