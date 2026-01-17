// Тип для конфигурации
export interface AxiosServiceConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Интерфейс для стандартного ответа API
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success: boolean;
  meta?: Record<string, any>;
}

// Интерфейсы для событий
export interface UnauthorizedEvent {
  timestamp: number;
  message: string;
  code?: string;
}

export interface NetworkErrorEvent {
  timestamp: number;
  message: string;
  code?: string;
  url?: string;
}

export interface RequestCompletedEvent {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  duration: number;
}

// Тип для конфигурации
export interface AxiosServiceConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Другие типы событий, если нужно
export type AxiosServiceEvent =
  | { type: 'unauthorized'; data: UnauthorizedEvent }
  | { type: 'network_error'; data: { message: string } }
  | { type: 'request_completed'; data: { url: string; duration: number } };

// Тип для конфигурации
export interface AxiosServiceConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface UnauthorizedEvent {
  timestamp: number;
  message: string;
  code?: string;
}
