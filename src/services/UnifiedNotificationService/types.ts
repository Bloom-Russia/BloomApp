export type NotificationPayload = {
  title?: string;
  body?: string;
  data?: Record<string, string | number | object>;
  messageId?: string;
  eventType?: string;
};
