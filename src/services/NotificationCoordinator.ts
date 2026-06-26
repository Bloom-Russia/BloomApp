import { noop } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import AxiosService from './AxiosService';
import UnifiedNotificationService, { NotificationPayload } from './UnifiedNotificationService';

interface NotificationCoordinatorProps {
  onNotificationReceived?: (notification: NotificationPayload) => void;
}

export const NotificationCoordinator: React.FC<NotificationCoordinatorProps> = ({
  onNotificationReceived,
}): React.ReactElement | null => {
  const appState = useRef(AppState.currentState);
  const [isAxiosInitialized, setIsAxiosInitialized] = useState(false);
  const nativeEventEmitter = useRef<NativeEventEmitter | null>(null);
  const setupCompleteRef = useRef(false);
  const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastProcessedNotifications = useRef<Map<string, number>>(new Map());

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

  const initializeAxiosLogging = useCallback(async (): Promise<boolean> => {
    try {
      if (!AxiosService.isServiceInitialized()) {
        await AxiosService.initializeWithAppDefaults({ timeout: 10000 });
      }
      setIsAxiosInitialized(true);
      return true;
    } catch {
      setIsAxiosInitialized(false);
      return false;
    }
  }, []);

  const logNotificationEvent = useCallback(
    async (
      eventType: string,
      notificationData: Record<string, unknown>,
      additionalData?: Record<string, unknown>,
    ): Promise<void> => {
      if (!isAxiosInitialized) {
        return;
      }

      try {
        await AxiosService.post('/api/notifications/log', {
          eventType,
          notificationData,
          platform: Platform.OS,
          appState: appState.current,
          timestamp: new Date().toISOString(),
          ...additionalData,
        });
      } catch {
        // Игнорируем ошибки логирования
      }
    },
    [isAxiosInitialized],
  );

  const updateBadgeCount = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      const badgeCount = await UnifiedNotificationService.getBadgeCount();
      await UnifiedNotificationService.setBadgeCount(badgeCount);
    } catch {
      // Игнорируем ошибки
    }
  }, []);

  const isDuplicateNotification = useCallback(
    (notificationId?: string, eventType?: string): boolean => {
      if (!notificationId) {
        return false;
      }

      const key = `${eventType || 'unknown'}_${notificationId}`;
      const now = Date.now();
      const lastTime = lastProcessedNotifications.current.get(key);

      if (lastTime && now - lastTime < 2000) {
        return true;
      }

      lastProcessedNotifications.current.set(key, now);
      setTimeout(() => {
        lastProcessedNotifications.current.delete(key);
      }, 2000);

      return false;
    },
    [],
  );

  const handleVerificationCode = useCallback(
    async (notification: NotificationPayload): Promise<void> => {
      const code = notification.data?.code as string;
      const requestId = notification.data?.requestId as string;

      if (code && requestId) {
        await logNotificationEvent('verification_code_received', {
          requestId,
          hasCode: !!code,
        });
      }
    },
    [logNotificationEvent],
  );

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (Platform.OS === 'ios') {
          updateBadgeCount().then(noop);
        }
      }
      appState.current = nextAppState;
    },
    [updateBadgeCount],
  );

  const setupNotificationHandler = useCallback((): void => {
    if (setupCompleteRef.current) {
      return;
    }

    unsubscribeRef.current = UnifiedNotificationService.subscribe(
      async (notification: NotificationPayload) => {
        if (isDuplicateNotification(notification.messageId, notification.eventType)) {
          return;
        }

        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }

        await logNotificationEvent('notification_received', {
          title: notification.title,
          eventType: notification.eventType,
          messageId: notification.messageId,
          hasData: !!notification.data,
        });

        if (notification.data?.type === 'verification' || notification.data?.code) {
          await handleVerificationCode(notification);
        }

        switch (notification.eventType) {
          case 'press':
          case 'open':
          case 'initial': {
            const screen = notification.data?.screen as string;
            if (screen) {
              // TODO: Добавить NavigationService.navigate(screen, notification.data)
            }
            break;
          }
          default:
            break;
        }

        if (Platform.OS === 'ios') {
          await updateBadgeCount();
        }
      },
    );

    setupCompleteRef.current = true;
  }, [
    onNotificationReceived,
    logNotificationEvent,
    handleVerificationCode,
    updateBadgeCount,
    isDuplicateNotification,
  ]);

  const setupIOSSilentPushHandler = useCallback((): (() => void) => {
    if (Platform.OS !== 'ios' || !nativeEventEmitter.current) {
      return () => {};
    }

    const handler = async (data: Record<string, unknown>): Promise<void> => {
      await updateBadgeCount();
      await logNotificationEvent('ios_silent_push', data);
    };

    const subscription = nativeEventEmitter.current.addListener('DataUpdated', handler);

    return () => subscription.remove();
  }, [updateBadgeCount, logNotificationEvent]);

  const initializeServices = useCallback(async (): Promise<() => void> => {
    try {
      await UnifiedNotificationService.initialize();
      await initializeAxiosLogging();
      setupNotificationHandler();

      if (Platform.OS === 'ios') {
        return setupIOSSilentPushHandler();
      }

      return () => {};
    } catch {
      return () => {};
    }
  }, [initializeAxiosLogging, setupNotificationHandler, setupIOSSilentPushHandler]);

  useEffect(() => {
    let isMounted = true;
    let iosCleanup: (() => void) | undefined;
    const currentLastProcessed = lastProcessedNotifications.current;

    const init = async (): Promise<void> => {
      if (!isMounted) {
        return;
      }
      const cleanup = await initializeServices();
      if (!isMounted) {
        return;
      }
      iosCleanup = cleanup;
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
      currentLastProcessed.clear();
    };
  }, [initializeServices, handleAppStateChange]);

  return null;
};
