// ============================================
// ОБЩИЕ УТИЛИТАРНЫЕ ТИПЫ
// ============================================

/** Результат операции */
export type Result<T> = {
  success: boolean;
  data?: T;
  error?: string | Error;
};

/** Состояние загрузки */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Сортировка */
export type SortOrder = 'asc' | 'desc';

/** Пагинация */
export type PaginationParams = {
  page: number;
  limit: number;
  offset?: number;
};

/** Ответ с пагинацией */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Фильтры */
export type Filters<T = Record<string, unknown>> = {
  search?: string;
  sortBy?: keyof T;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
} & Partial<T>;

// ============================================
// ТИПЫ ДЛЯ ФОРМ
// ============================================

/** Статус поля формы */
export type FieldStatus = 'idle' | 'touched' | 'focused' | 'error';

/** Ошибки формы */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// ============================================
// ТИПЫ ДЛЯ API
// ============================================

/** HTTP методы */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Заголовки запроса */
export type HttpHeaders = Record<string, string>;

// ============================================
// ТИПЫ ДЛЯ СТОРА
// ============================================

/** Базовый интерфейс для Store */
export interface IStore {
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// ============================================
// ТИПЫ ДЛЯ УВЕДОМЛЕНИЙ
// ============================================

/** Тип уведомления */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** Уведомление */
export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
};
