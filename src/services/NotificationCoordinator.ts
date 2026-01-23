// NotificationCoordinator.ts - исправленная версия
import { AndroidStyle, EventType } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import AxiosService from './AxiosService';
import NotifeeService, { FirebaseNotificationData } from './NotifeeService';
import NotificationService from './NotificationService';

interface NotificationCoordinatorProps {
  onNotificationReceived?: (notification: FirebaseMessagingTypes.RemoteMessage) => void;
}

/**
 * Координатор уведомлений - центральный компонент для управления
 * получением, обработкой и отображением push-уведомлений в приложении.
 */
export const NotificationCoordinator: React.FC<NotificationCoordinatorProps> = ({
  onNotificationReceived,
}): React.ReactElement | null => {
  const appState = useRef(AppState.currentState);
  const [isAxiosInitialized, setIsAxiosInitialized] = useState(false);
  const nativeEventEmitter = useRef<NativeEventEmitter | null>(null);
  const isProcessingRef = useRef<Set<string>>(new Set());
  const setupCompleteRef = useRef(false);

  console.log('🔔 NotificationCoordinator mounted');

  // Инициализация NativeEventEmitter для iOS
  useEffect(() => {
    if (Platform.OS === 'ios' && NativeModules.RCTDeviceEventEmitter) {
      nativeEventEmitter.current = new NativeEventEmitter(NativeModules.RCTDeviceEventEmitter);
    }

    return (): void => {
      // Очистка при размонтировании
      if (nativeEventEmitter.current) {
        nativeEventEmitter.current.removeAllListeners('DataUpdated');
      }
      isProcessingRef.current.clear();
    };
  }, []);

  /**
   * Инициализация системы логирования уведомлений
   */
  const initializeAxiosLogging = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔧 Инициализация Axios для логирования уведомлений...');

      // Проверяем, инициализирован ли AxiosService
      if (!AxiosService.isServiceInitialized()) {
        // Инициализируем с базовыми настройками
        await AxiosService.initializeWithAppDefaults({
          timeout: 10000,
        });
      }

      console.log('✅ Axios успешно инициализирован для логирования уведомлений');
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
   * Логирование события уведомления в аналитику
   */
  const logNotificationEvent = useCallback(
    async (
      eventType: string,
      notificationData: Record<string, unknown>,
      additionalData?: Record<string, unknown>,
    ): Promise<void> => {
      if (!isAxiosInitialized) {
        console.log(`📝 Пропускаем логирование ${eventType}, Axios не инициализирован`);
        return;
      }

      try {
        // Используем AxiosService напрямую
        await AxiosService.post('/api/notifications/log', {
          eventType,
          notificationData,
          platform: Platform.OS,
          appState: appState.current,
          timestamp: new Date().toISOString(),
          ...additionalData,
        });
        console.log(`📝 Событие ${eventType} успешно залогировано`);
      } catch (error) {
        console.warn(`⚠️ Не удалось залогировать событие!`, error);
      }
    },
    [isAxiosInitialized],
  );

  /**
   * Безопасная проверка доступности Axios
   */
  const checkAxiosAvailability = useCallback((): boolean => {
    return isAxiosInitialized && AxiosService.isServiceInitialized();
  }, [isAxiosInitialized]);

  /**
   * Обновление бейджей для iOS
   */
  const updateBadgeCount = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // Получаем количество непрочитанных уведомлений
      const displayedNotifications = await NotifeeService.getDisplayedNotifications();
      const badgeCount = displayedNotifications.length;

      // Обновляем бейджи
      await NotifeeService.setBadgeCount(badgeCount);
      console.log(`📱 iOS: Бейджи обновлены: ${badgeCount}`);

      // Логируем обновление бейджей
      if (checkAxiosAvailability()) {
        await logNotificationEvent('ios_badge_updated', { badgeCount });
      }
    } catch (error: unknown) {
      console.warn('⚠️ Не удалось обновить бейджи на iOS:', error);
    }
  }, [checkAxiosAvailability, logNotificationEvent]);

  /**
   * Координация отображения уведомления из фонового сообщения
   */
  const coordinateBackgroundNotification = useCallback(
    async (remoteMessage: FirebaseNotificationData): Promise<void> => {
      const messageId = remoteMessage.messageId || `bg_${Date.now()}`;

      // Проверяем дедупликацию
      if (isProcessingRef.current.has(messageId)) {
        console.log(`⚠️ Фоновое уведомление уже обрабатывается: ${messageId}`);
        return;
      }

      isProcessingRef.current.add(messageId);

      try {
        const { notification, data } = remoteMessage;

        // Логируем получение фонового уведомления
        await logNotificationEvent('background_received', {
          title: notification?.title,
          body: notification?.body,
          messageId: remoteMessage.messageId,
        });

        // Обновляем бейджи для iOS
        if (Platform.OS === 'ios') {
          await updateBadgeCount();
        }

        // Координируем отображение через Notifee
        await NotifeeService.showNotification({
          title: notification?.title || 'Новое уведомление',
          body: notification?.body || 'У вас новое сообщение',
          data: { ...data, source: 'background' },
          type: 'info',
          priority: 'high',
          android: {
            channelId: 'alerts',
            pressAction: {
              id: 'default',
            },
            // Добавляем большой логотип для Android
            largeIcon: 'logo_large', // Убедитесь что этот ресурс есть в Android проекте
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: 'logo_large', // Для больших изображений
            },
          },
          ios:
            Platform.OS === 'ios'
              ? {
                  foregroundPresentationOptions: {
                    alert: true,
                    badge: true, // Включаем бейджи
                    sound: true,
                    banner: true,
                    list: true,
                  },
                  badgeCount: 1, // Увеличиваем счетчик бейджей
                }
              : undefined,
        });

        console.log('📢 Координатор: уведомление показано из фона');

        // Логируем успешное отображение
        await logNotificationEvent('background_displayed', {
          title: notification?.title,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error('Координатор: ошибка отображения уведомления из фона:', errorMessage);
        await logNotificationEvent('background_error', { error: errorMessage });
      } finally {
        // Очищаем через 10 секунд на случай ретраев
        setTimeout(() => {
          isProcessingRef.current.delete(messageId);
        }, 10000);
      }
    },
    [logNotificationEvent, updateBadgeCount],
  );

  /**
   * Координация обработки фонового сообщения
   */
  const coordinateBackgroundMessage = useCallback(
    async (remoteMessage: FirebaseNotificationData): Promise<void> => {
      const messageId = remoteMessage.messageId || `bgmsg_${Date.now()}`;

      try {
        console.log('🌙 Координатор: получено фоновое сообщение:', remoteMessage.messageId);

        // Координируем отображение для фоновых сообщений
        if (remoteMessage.notification || remoteMessage.data) {
          await coordinateBackgroundNotification(remoteMessage);
        }

        // Передаем обработку в NotifeeService
        await NotifeeService.handleBackgroundMessage(remoteMessage);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error('Координатор: ошибка обработки фонового сообщения:', errorMessage);
      }
    },
    [coordinateBackgroundNotification],
  );

  /**
   * Координация обработки тапа по уведомлению
   */
  const coordinateNotificationTap = useCallback(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> => {
      const messageId = remoteMessage.messageId || `tap_${Date.now()}`;

      if (isProcessingRef.current.has(messageId)) {
        console.log(`⚠️ Тап по уведомлению уже обрабатывается: ${messageId}`);
        return;
      }

      isProcessingRef.current.add(messageId);

      try {
        const notificationData = remoteMessage.data || {};
        console.log('Координатор: данные уведомления для навигации:', notificationData);

        // Для iOS уменьшаем счетчик бейджей при открытии уведомления
        if (Platform.OS === 'ios') {
          const currentBadgeCount = await NotifeeService.getDisplayedNotifications().then(
            (notifications) => notifications.length,
          );

          if (currentBadgeCount > 0) {
            await NotifeeService.setBadgeCount(currentBadgeCount - 1);
            console.log(`📱 iOS: Бейдж уменьшен до ${currentBadgeCount - 1}`);
          }
        }

        // Логируем взаимодействие пользователя
        await logNotificationEvent('notification_tap', {
          messageId: remoteMessage.messageId,
          screen: notificationData.screen,
          action: notificationData.action,
          notificationId: notificationData.notificationId,
        });

        // TODO: Добавить навигацию через NavigationService
        // if (notificationData.screen) {
        //   console.log(`Координатор: навигация на экран: ${notificationData.screen}`);
        // }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error('Координатор: ошибка обработки тапа по уведомлению:', errorMessage);
        await logNotificationEvent('tap_error', { error: errorMessage });
      } finally {
        setTimeout(() => {
          isProcessingRef.current.delete(messageId);
        }, 5000);
      }
    },
    [logNotificationEvent],
  );

  /**
   * Координация проверки непрочитанных уведомлений
   */
  const coordinatePendingNotificationsCheck = useCallback(async (): Promise<void> => {
    try {
      const displayedNotifications = await NotifeeService.getDisplayedNotifications();
      console.log('Координатор: текущие отображенные уведомления:', displayedNotifications.length);

      // Обновляем бейджи для iOS
      if (Platform.OS === 'ios') {
        await updateBadgeCount();
      }

      // Координируем сбор статистики
      if (checkAxiosAvailability() && displayedNotifications.length > 0) {
        await logNotificationEvent('notifications_check', {
          displayedCount: displayedNotifications.length,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Координатор: ошибка проверки уведомлений:', errorMessage);
    }
  }, [checkAxiosAvailability, logNotificationEvent, updateBadgeCount]);

  /**
   * Координация обработки изменения состояния приложения
   */
  const coordinateAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      console.log(`Координатор: состояние приложения: ${appState.current} -> ${nextAppState}`);

      // Координируем действия при переходе в активное состояние
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('Координатор: приложение перешло в активное состояние');

        // Для iOS обновляем бейджи при возвращении в активное состояние
        if (Platform.OS === 'ios') {
          updateBadgeCount().catch((error: unknown) => {
            console.error('Ошибка при обновлении бейджей:', error);
          });
        }

        coordinatePendingNotificationsCheck().catch((error: unknown) => {
          console.error('Ошибка при проверке уведомлений:', error);
        });
      }

      appState.current = nextAppState;

      // Логируем изменение состояния приложения
      if (checkAxiosAvailability()) {
        logNotificationEvent('app_state_change', {
          previousState: appState.current,
          newState: nextAppState,
        }).catch(() => {
          // Игнорируем ошибки логирования
        });
      }
    },
    [
      coordinatePendingNotificationsCheck,
      checkAxiosAvailability,
      logNotificationEvent,
      updateBadgeCount,
    ],
  );

  /**
   * Координация обработки активного состояния приложения (foreground)
   */
  const coordinateForegroundMessageHandler = useCallback((): (() => void) => {
    console.log('🔔 Координатор: настройка обработчика foreground сообщений');

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const messageId = remoteMessage.messageId || `fg_${Date.now()}`;

      console.log('🔔 Координатор: уведомление получено в активном приложении:', messageId);

      // Проверяем дедупликацию
      if (isProcessingRef.current.has(messageId)) {
        console.log('⚠️ Уведомление уже обрабатывается:', messageId);
        return;
      }

      isProcessingRef.current.add(messageId);

      try {
        // Вызываем пропс если есть
        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage);
        }

        // Логируем получение уведомления в foreground
        await logNotificationEvent('foreground_received', {
          messageId: remoteMessage.messageId,
          title: remoteMessage.notification?.title,
        });

        const firebaseData = remoteMessage as FirebaseNotificationData;

        // Обновляем бейджи для iOS
        if (Platform.OS === 'ios') {
          await updateBadgeCount();
        }

        // Только для Android показываем уведомление через Notifee
        // Для iOS уведомления приходят через систему
        if (Platform.OS === 'android') {
          await NotifeeService.showNotification({
            title: firebaseData.notification?.title || 'Новое уведомление',
            body: firebaseData.notification?.body || '',
            data: { ...firebaseData.data, source: 'foreground' },
            type: 'info',
            priority: 'high',
            android: {
              channelId: 'alerts',
              pressAction: { id: 'default' },
              largeIcon: 'logo_large',
              style: {
                type: AndroidStyle.BIGPICTURE,
                picture: 'logo_large_foreground',
              },
            },
          });
        }

        // Координируем трансформацию и уведомление подписчиков
        const notification = NotificationService.transformFirebaseMessage(remoteMessage);
        NotificationService.notifySubscribers(notification);

        // Логируем успешную обработку
        await logNotificationEvent('foreground_processed', {
          messageId: remoteMessage.messageId,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error(
          'Координатор: ошибка обработки уведомления в активном приложении:',
          errorMessage,
        );
        await logNotificationEvent('foreground_error', {
          messageId: remoteMessage.messageId,
          error: errorMessage,
        });
      } finally {
        // Очищаем через 10 секунд
        setTimeout(() => {
          isProcessingRef.current.delete(messageId);
        }, 10000);
      }
    });

    return unsubscribe;
  }, [logNotificationEvent, onNotificationReceived, updateBadgeCount]);

  /**
   * Координация обработки фонового состояния приложения
   */
  const coordinateBackgroundMessageHandler = useCallback((): void => {
    console.log('🌙 Координатор: настройка обработчика background сообщений');

    // Устанавливаем глобальный обработчик для фоновых сообщений
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log(
        '🌙 Координатор: уведомление получено в фоновом режиме:',
        remoteMessage.messageId,
      );

      try {
        await coordinateBackgroundMessage(remoteMessage as FirebaseNotificationData);
        return Promise.resolve();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error('Координатор: ошибка обработки фонового уведомления:', errorMessage);
        return Promise.reject(error);
      }
    });
  }, [coordinateBackgroundMessage]);

  /**
   * Координация обработки открытия приложения по уведомлению
   */
  const coordinateNotificationOpenedHandler = useCallback((): void => {
    console.log('📱 Координатор: настройка обработчика открытия по уведомлению');

    // Обработчик когда приложение было в фоне
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        '📱 Координатор: приложение открыто по уведомлению из фона:',
        remoteMessage.messageId,
      );
      coordinateNotificationTap(remoteMessage).catch((error: unknown) => {
        console.error('Ошибка при обработке тапа по уведомлению:', error);
      });
    });

    // Обработчик когда приложение было полностью закрыто
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            '🚀 Координатор: приложение запущено по уведомлению:',
            remoteMessage.messageId,
          );
          coordinateNotificationTap(remoteMessage).catch((error: unknown) => {
            console.error('Ошибка при обработке тапа по уведомлению:', error);
          });
        }
      })
      .catch((error: unknown) => {
        console.error('Ошибка при получении initial notification:', error);
      });
  }, [coordinateNotificationTap]);

  /**
   * Координация обработки событий Notifee
   */
  const coordinateNotifeeEventHandlers = useCallback((): (() => void) => {
    console.log('🎯 Координатор: настройка обработчиков событий Notifee');

    const unsubscribe = NotifeeService.onNotificationEvent(({ type, detail }) => {
      console.log(`🎯 Координатор: событие Notifee: ${type}`, detail.notification?.id);

      // Координируем логирование событий Notifee
      if (checkAxiosAvailability()) {
        const eventTypeString = EventType[type] || type.toString();
        logNotificationEvent(`notifee_${eventTypeString.toLowerCase()}`, {
          notificationId: detail.notification?.id,
          pressActionId: detail.pressAction?.id,
          data: detail.notification?.data,
        }).catch(() => {
          // Игнорируем ошибки логирования
        });
      }

      // Обновляем бейджи для iOS при определенных событиях
      if (Platform.OS === 'ios' && (type === EventType.DISMISSED || type === EventType.PRESS)) {
        updateBadgeCount().catch((error: unknown) => {
          console.error('Ошибка при обновлении бейджей:', error);
        });
      }

      // Координируем обработку разных типов событий
      switch (type) {
        case EventType.PRESS:
          console.log('Координатор: уведомление нажато:', detail.notification?.data);
          // TODO: Добавить навигацию через NavigationService
          break;

        case EventType.ACTION_PRESS:
          console.log('Координатор: действие нажато:', detail.pressAction?.id);
          // Можно обработать действие здесь
          break;

        case EventType.DISMISSED:
          console.log('Координатор: уведомление закрыто');
          break;

        case EventType.DELIVERED:
          console.log('Координатор: уведомление доставлено');
          break;

        default:
          console.log(`Координатор: необработанное событие: ${type}`);
          break;
      }
    });

    return unsubscribe;
  }, [checkAxiosAvailability, logNotificationEvent, updateBadgeCount]);

  /**
   * Координация подписки на получение уведомлений
   */
  const coordinateNotifeeSubscription = useCallback((): (() => void) => {
    console.log('📨 Координатор: настройка подписки на Notifee');

    const unsubscribe = NotifeeService.subscribe((notification) => {
      console.log('📨 Координатор: новое уведомление через Notifee:', notification.id);
    });

    return unsubscribe;
  }, []);

  /**
   * Обработчик silent push для iOS
   */
  const setupIOSSilentPushHandler = useCallback((): (() => void) => {
    if (Platform.OS !== 'ios' || !nativeEventEmitter.current) {
      return (): void => {}; // Пустая функция очистки
    }

    console.log('📱 Координатор iOS: настройка silent push handler');

    const handler = (data: Record<string, unknown>): void => {
      console.log('📱 Координатор iOS: silent push получен:', data);

      // Обновляем бейджи при silent push
      updateBadgeCount().catch((error: unknown) => {
        console.error('Ошибка при обновлении бейджей:', error);
      });

      // Логирование silent push
      if (isAxiosInitialized) {
        logNotificationEvent('ios_silent_push', data).catch(() => {
          // Игнорируем ошибки логирования
        });
      }
    };

    // Подписываемся на события silent push
    const subscription = nativeEventEmitter.current.addListener('DataUpdated', handler);

    return (): void => {
      subscription.remove();
      console.log('📱 Координатор iOS: silent push handler удален');
    };
  }, [isAxiosInitialized, logNotificationEvent, updateBadgeCount]);

  /**
   * Координация настройки всех обработчиков уведомлений
   */
  const coordinateNotificationHandlers = useCallback((): (() => void) => {
    if (setupCompleteRef.current) {
      console.warn('⚠️ Обработчики уведомлений уже настроены!');
      return () => {};
    }

    console.log('🚀 Координатор: настройка всех обработчиков уведомлений...');

    // 1. Координируем обработчик для активного состояния
    const foregroundUnsubscribe = coordinateForegroundMessageHandler();

    // 2. Координируем обработчик для фонового/закрытого состояния
    coordinateBackgroundMessageHandler();

    // 3. Координируем обработчик открытия приложения по уведомлению
    coordinateNotificationOpenedHandler();

    // 4. Координируем подписку на события Notifee
    const notifeeEventUnsubscribe = coordinateNotifeeEventHandlers();

    // 5. Координируем подписку на получение уведомлений
    const notifeeSubscriptionUnsubscribe = coordinateNotifeeSubscription();

    setupCompleteRef.current = true;

    console.log('✅ Координатор: все обработчики уведомлений настроены');

    // Функция очистки всех координаций
    return (): void => {
      console.log('🧹 Координатор: очистка обработчиков уведомлений...');
      foregroundUnsubscribe();
      notifeeEventUnsubscribe();
      notifeeSubscriptionUnsubscribe();
      setupCompleteRef.current = false;
    };
  }, [
    coordinateForegroundMessageHandler,
    coordinateBackgroundMessageHandler,
    coordinateNotificationOpenedHandler,
    coordinateNotifeeEventHandlers,
    coordinateNotifeeSubscription,
  ]);

  /**
   * Координация инициализации бейджей для iOS
   */
  const coordinateBadgeInitialization = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // Инициализируем бейджи при запуске
      await updateBadgeCount();
      console.log('📱 iOS: Бейджи инициализированы');
    } catch (error: unknown) {
      console.warn('⚠️ Не удалось инициализировать бейджи на iOS:', error);
    }
  }, [updateBadgeCount]);

  /**
   * Основная координация инициализации сервисов уведомлений
   */
  const coordinateNotificationServices = useCallback(async (): Promise<void> => {
    try {
      console.log('🚀 Координатор: инициализация сервисов уведомлений...');

      // 1. Координируем инициализацию Firebase Notification Service
      await NotificationService.initialize();

      // 2. Координируем инициализацию Notifee Service
      await NotifeeService.initializeService();

      // 3. Координируем инициализацию логирования через Axios
      await initializeAxiosLogging();

      // 4. Координируем инициализацию бейджей для iOS
      await coordinateBadgeInitialization();

      // 5. Координируем установку обработчика фоновых сообщений для Notifee
      NotifeeService.setBackgroundMessageHandler(
        async (remoteMessage: FirebaseNotificationData): Promise<void> => {
          await coordinateBackgroundMessage(remoteMessage);
        },
      );

      console.log('✅ Координатор: все сервисы уведомлений успешно инициализированы');

      // Координируем логирование успешной инициализации
      if (checkAxiosAvailability()) {
        await logNotificationEvent('coordinator_initialized', {
          services: ['NotificationService', 'NotifeeService', 'AxiosService'],
          platform: Platform.OS,
          hasBadgeSupport: Platform.OS === 'ios',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('❌ Координатор: ошибка инициализации сервисов уведомлений:', errorMessage);

      // Координируем логирование ошибки инициализации
      if (checkAxiosAvailability()) {
        await logNotificationEvent('initialization_error', {
          error: errorMessage,
          stack: errorStack,
        }).catch(() => {
          // Игнорируем ошибки логирования
        });
      }
    }
  }, [
    initializeAxiosLogging,
    coordinateBackgroundMessage,
    checkAxiosAvailability,
    logNotificationEvent,
    coordinateBadgeInitialization,
  ]);

  /**
   * Основной эффект координации жизненного цикла уведомлений
   */
  useEffect(() => {
    let cleanupHandlers: (() => void) | undefined;
    let iosSilentPushCleanup: (() => void) | undefined;
    let isMounted = true;

    const setupNotificationCoordinator = async (): Promise<void> => {
      try {
        if (!isMounted) {
          return;
        }

        console.log('🚀 Начало настройки координатора уведомлений...');

        // Координируем инициализацию всех сервисов уведомлений
        await coordinateNotificationServices();

        if (!isMounted) {
          return;
        }

        // Координируем настройку обработчиков для разных состояний приложения
        // ТОЛЬКО ОДИН РАЗ!
        cleanupHandlers = coordinateNotificationHandlers();

        // Для iOS настраиваем дополнительный обработчик silent push
        if (Platform.OS === 'ios') {
          iosSilentPushCleanup = setupIOSSilentPushHandler();
        }

        console.log('✅ Координатор уведомлений настроен');
      } catch (error) {
        console.error('❌ Ошибка при настройке координатора уведомлений:', error);
      }
    };

    setupNotificationCoordinator().catch((error: unknown) => {
      console.error('Ошибка при инициализации координатора уведомлений:', error);
    });

    // Координируем мониторинг изменений состояния приложения
    const appStateSubscription = AppState.addEventListener('change', coordinateAppStateChange);

    return (): void => {
      isMounted = false;
      console.log('🧹 Очистка координатора уведомлений...');

      // Координируем очистку всех подписок
      cleanupHandlers?.();
      iosSilentPushCleanup?.();
      appStateSubscription.remove();
      isProcessingRef.current.clear();
    };
  }, [
    coordinateNotificationServices,
    coordinateNotificationHandlers,
    coordinateAppStateChange,
    setupIOSSilentPushHandler,
  ]);

  return null;
};

// Дефолтный экспорт для удобства импорта
export default NotificationCoordinator;
