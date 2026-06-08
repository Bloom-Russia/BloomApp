export type NotificationPayload = {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, string | number | object>;
  messageId?: string;
  eventType?: string;
};
