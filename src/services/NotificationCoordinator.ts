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

/**
 * Координатор уведомлений - использует только UnifiedNotificationService
 */
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

  console.log('🔔 NotificationCoordinator mounted');

  // Инициализация NativeEventEmitter для iOS
  useEffect(() => {
    if (Platform.OS === 'ios' && NativeModules.RCTDeviceEventEmitter) {
      nativeEventEmitter.current = new NativeEventEmitter(NativeModules.RCTDeviceEventEmitter);
    }

    return (): void => {
      if (nativeEventEmitter.current) {
        nativeEventEmitter.current.removeAllListeners('DataUpdated');
      }
    };
  }, []);

  /**
   * Инициализация Axios для логирования
   */
  const initializeAxiosLogging = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔧 Инициализация Axios для логирования уведомлений...');

      if (!AxiosService.isServiceInitialized()) {
        await AxiosService.initializeWithAppDefaults({
          timeout: 10000,
        });
      }

      console.log('✅ Axios успешно инициализирован');
      setIsAxiosInitialized(true);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.warn('⚠️ Axios не готов для логирования:', errorMessage);
      setIsAxiosInitialized(false);
      return false;
    }
  }, []);

  /**
   * Логирование события уведомления
   */
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
        console.log(`📝 Событие ${eventType} залогировано`);
      } catch (error) {
        console.warn(`⚠️ Не удалось залогировать событие:`, error);
      }
    },
    [isAxiosInitialized],
  );

  /**
   * Обновление бейджей для iOS
   */
  const updateBadgeCount = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      const badgeCount = await UnifiedNotificationService.getBadgeCount();
      await UnifiedNotificationService.setBadgeCount(badgeCount);
      console.log(`📱 iOS: Бейджи обновлены: ${badgeCount}`);
    } catch (error) {
      console.warn('⚠️ Не удалось обновить бейджи:', error);
    }
  }, []);

  /**
   * Проверка дедупликации уведомлений на уровне координатора
   */
  const isDuplicateNotification = useCallback(
    (notificationId?: string, eventType?: string): boolean => {
      if (!notificationId) {
        return false;
      }

      const key = `${eventType || 'unknown'}_${notificationId}`;
      const now = Date.now();
      const lastTime = lastProcessedNotifications.current.get(key);

      if (lastTime && now - lastTime < 2000) {
        console.log(`⏭️ Координатор: дубликат игнорируется: ${key}`);
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

  /**
   * Обработка получения кода подтверждения
   */
  const handleVerificationCode = useCallback(
    async (notification: NotificationPayload): Promise<void> => {
      const code = notification.data?.code as string;
      const requestId = notification.data?.requestId as string;

      if (code && requestId) {
        console.log(`🔐 Получен код подтверждения: ${code} для requestId: ${requestId}`);

        await logNotificationEvent('verification_code_received', {
          requestId,
          hasCode: !!code,
        });
      }
    },
    [logNotificationEvent],
  );

  /**
   * Обработка изменения состояния приложения
   */
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      console.log(`Координатор: состояние: ${appState.current} -> ${nextAppState}`);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('Координатор: приложение в активном состоянии');

        if (Platform.OS === 'ios') {
          updateBadgeCount().catch(console.error);
        }
      }

      appState.current = nextAppState;
    },
    [updateBadgeCount],
  );

  /**
   * Единый обработчик всех уведомлений
   */
  const setupNotificationHandler = useCallback((): void => {
    if (setupCompleteRef.current) {
      console.log('⚠️ Обработчик уже настроен');
      return;
    }

    console.log('🚀 Настройка единого обработчика уведомлений...');

    // Единая подписка на все уведомления
    unsubscribeRef.current = UnifiedNotificationService.subscribe(
      (notification: NotificationPayload) => {
        // Проверка дубликатов на уровне координатора
        if (isDuplicateNotification(notification.messageId, notification.eventType)) {
          return;
        }

        console.log('📱 Получено уведомление:', {
          title: notification.title,
          eventType: notification.eventType,
          messageId: notification.messageId,
        });

        // Вызываем callback если передан
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }

        // Логируем получение
        logNotificationEvent('notification_received', {
          title: notification.title,
          eventType: notification.eventType,
          messageId: notification.messageId,
          hasData: !!notification.data,
        }).catch(() => {});

        // Специальная обработка для кода подтверждения
        if (notification.data?.type === 'verification' || notification.data?.code) {
          handleVerificationCode(notification).catch(() => {});
        }

        // Обработка различных типов событий
        switch (notification.eventType) {
          case 'press':
          case 'open':
          case 'initial': {
            console.log('📱 Пользователь нажал на уведомление');

            // Навигация на нужный экран
            const screen = notification.data?.screen as string;
            if (screen) {
              console.log(`🚀 Навигация на экран: ${screen}`);
              // TODO: Добавить NavigationService.navigate(screen, notification.data)
            }
            break;
          }

          case 'foreground':
            console.log('📱 Уведомление получено в foreground');
            break;

          case 'background':
            console.log('📱 Уведомление получено в background');
            break;

          default:
            console.log('📱 Уведомление другого типа:', notification.eventType);
            break;
        }

        // Обновляем бейджи для iOS
        if (Platform.OS === 'ios') {
          updateBadgeCount().catch(() => {});
        }
      },
    );

    setupCompleteRef.current = true;
    console.log('✅ Единый обработчик уведомлений настроен');
  }, [
    onNotificationReceived,
    logNotificationEvent,
    handleVerificationCode,
    updateBadgeCount,
    isDuplicateNotification,
  ]);

  /**
   * Настройка iOS silent push handler
   */
  const setupIOSSilentPushHandler = useCallback((): (() => void) => {
    if (Platform.OS !== 'ios' || !nativeEventEmitter.current) {
      return () => {};
    }

    console.log('📱 iOS: настройка silent push handler');

    const handler = async (data: Record<string, unknown>): Promise<void> => {
      console.log('📱 iOS: silent push получен:', data);

      await updateBadgeCount();

      await logNotificationEvent('ios_silent_push', data);
    };

    const subscription = nativeEventEmitter.current.addListener('DataUpdated', handler);

    return () => {
      subscription.remove();
      console.log('📱 iOS: silent push handler удален');
    };
  }, [updateBadgeCount, logNotificationEvent]);

  /**
   * Инициализация всех сервисов
   */
  const initializeServices = useCallback(async (): Promise<() => void> => {
    try {
      console.log('🚀 Инициализация сервисов...');

      // Инициализируем UnifiedNotificationService (он сам инициализирует FCM и Notifee)
      await UnifiedNotificationService.initialize();

      // Инициализируем логирование
      await initializeAxiosLogging();

      // Настраиваем обработчик уведомлений
      setupNotificationHandler();

      // Для iOS настраиваем silent push
      if (Platform.OS === 'ios') {
        return setupIOSSilentPushHandler();
      }

      console.log('✅ Все сервисы инициализированы');
      return () => {};
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      return () => {};
    }
  }, [initializeAxiosLogging, setupNotificationHandler, setupIOSSilentPushHandler]);

  /**
   * Основной эффект
   */
  useEffect(() => {
    let isMounted = true;
    let iosCleanup: (() => void) | undefined;

    // Сохраняем ссылку на текущий Map для очистки
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

    init().catch(console.error);

    // Подписка на изменение состояния приложения
    appStateSubscriptionRef.current = AppState.addEventListener('change', handleAppStateChange);

    return (): void => {
      isMounted = false;
      console.log('🧹 Очистка координатора...');

      // Отписываемся от уведомлений
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Удаляем iOS обработчик
      if (iosCleanup) {
        iosCleanup();
      }

      // Удаляем подписку на AppState
      if (appStateSubscriptionRef.current) {
        appStateSubscriptionRef.current.remove();
      }

      setupCompleteRef.current = false;
      currentLastProcessed.clear();
    };
  }, [initializeServices, handleAppStateChange]);

  return null;
};
