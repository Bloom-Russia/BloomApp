// Тип для конфигурации
export interface AxiosServiceConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Интерфейс для стандартного ответа API
export interface ApiResponse<T = unknown> {
  data: T | null;
  status?: number;
  message?: string;
  success: boolean;
  meta?: Record<string, unknown>;
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
