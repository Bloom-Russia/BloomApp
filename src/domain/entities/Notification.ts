/**
 * Сущность уведомления
 */
export interface NotificationPayload {
  /** Уникальный идентификатор */
  id?: string;
  /** ID сообщения (FCM) */
  messageId?: string;
  /** Заголовок уведомления */
  title?: string;
  /** Текст уведомления */
  body?: string;
  /** Тип события */
  eventType?:
    | 'press'
    | 'open'
    | 'initial'
    | 'background'
    | 'foreground'
    | 'action_press'
    | 'dismissed'
    | 'delivered';
  /** Дополнительные данные */
  data?: Record<string, any>;
  /** Время получения */
  timestamp?: Date;
  read?: boolean;
}

/**
 * Лог уведомления для отправки на сервер
 */
export interface NotificationLog {
  /** Тип события */
  eventType: string;
  /** Данные уведомления */
  notificationData: Record<string, unknown>;
  /** Платформа (iOS/Android) */
  platform: string;
  /** Состояние приложения (active/background/inactive) */
  appState: string;
  /** Время события */
  timestamp: string;
  /** Дополнительные данные */
  additionalData?: Record<string, unknown>;
}

/**
 * Результат обработки уведомления
 */
export interface NotificationResult {
  success: boolean;
  error?: Error;
}
