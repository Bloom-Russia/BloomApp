import { SecureStorageKeys } from '@services';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { DeviceEventEmitter, Platform } from 'react-native';
import Config from 'react-native-config';
import { SecureStorageService } from '../SecureStorageService';
import {
  ApiResponse,
  AxiosServiceConfig,
  NetworkErrorEvent,
  RequestCompletedEvent,
  UnauthorizedEvent,
} from './types';

declare const __DEV__: boolean;

// Тип для заголовков, совместимый с разными версиями axios
type HeadersType = Record<string, string>;

class AxiosService {
  private static instance: AxiosInstance | null = null;
  private static isInitialized = false;
  private static isRefreshing = false;
  private static isProcessingUnauthorized = false;
  private static failedRequests: Array<{
    resolve: (value: AxiosResponse) => void;
    reject: (error: unknown) => void;
    config: AxiosRequestConfig;
  }> = [];

  private static readonly UNAUTHORIZED_EVENT = 'axios:unauthorized';
  private static readonly NETWORK_ERROR_EVENT = 'axios:network-error';
  private static readonly REQUEST_COMPLETED_EVENT = 'axios:request-completed';

  /**
   * Инициализация AxiosService
   */
  public static initialize(axiosConfig: AxiosServiceConfig = {}): void {
    if (this.isInitialized && this.instance) {
      console.warn('AxiosService уже инициализирован');
      return;
    }

    this.instance = axios.create({
      baseURL: Config.API_URL,
      timeout: axiosConfig.timeout || 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...axiosConfig.headers,
      } as HeadersType,
      withCredentials: axiosConfig.withCredentials || false,
    });

    // Интерцептор запросов
    this.instance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        // Приводим заголовки к типу Record<string, string>
        const headers = (requestConfig.headers || {}) as HeadersType;

        // Устанавливаем Content-Type если не установлен
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }

        // Добавляем токен авторизации
        const token = await this.getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Добавляем временную метку
        headers['X-Request-Timestamp'] = Date.now().toString();

        // Обновляем заголовки в конфиге
        requestConfig.headers = headers as typeof requestConfig.headers;

        return requestConfig;
      },
      (error: AxiosError) => {
        console.error('[Axios Ошибка Запроса]', error);
        this.emitNetworkError(error);
        return Promise.reject(error);
      },
    );

    // Интерцептор ответов
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const headers = response.config.headers as HeadersType;
        const timestamp = headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        if (__DEV__) {
          console.log(`[Axios Ответ] ${response.status} ${response.config.url}`, {
            duration: `${duration}мс`,
            data: response.data,
          });
        }

        this.emitRequestCompleted({
          url: response.config.url || '',
          method: response.config.method || '',
          status: response.status,
          duration,
        });

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;
        const headers = originalRequest?.headers as HeadersType | undefined;
        const timestamp = headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        console.error('[Axios Ошибка Ответа]', {
          status: error.response?.status,
          url: originalRequest?.url,
          method: originalRequest?.method,
          message: error.message,
          duration: `${duration}мс`,
          data: error.response?.data,
        });

        if (error.response?.status === 401 && originalRequest) {
          if (originalRequest.url?.includes('/api/auth/refresh')) {
            await this.handleUnauthorized();
            return Promise.reject(error);
          }

          try {
            return await this.handleTokenRefresh(originalRequest);
          } catch (refreshError) {
            await this.handleUnauthorized();
            return Promise.reject(refreshError);
          }
        }

        this.emitNetworkError(error);

        if (error.response?.status && error.response.status >= 500) {
          this.emitServerError(error);
        }

        return Promise.reject(error);
      },
    );

    this.isInitialized = true;

    if (__DEV__) {
      console.log('[AxiosService] Успешно инициализирован', {
        baseURL: this.instance.defaults.baseURL,
        timeout: this.instance.defaults.timeout,
      });
    }
  }

  /**
   * Получение экземпляра с проверкой на null
   */
  private static getInstanceOrThrow(): AxiosInstance {
    if (!this.instance) {
      throw new Error('AxiosService не инициализирован. Вызовите initialize() сначала.');
    }
    return this.instance;
  }

  /**
   * Обработка обновления токена
   */
  private static async handleTokenRefresh(
    originalRequest: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedRequests.push({ resolve, reject, config: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshSuccess = await this.tryRefreshToken();

      if (!refreshSuccess) {
        throw new Error('Не удалось обновить токен');
      }

      const newToken = await this.getAuthToken();
      if (newToken && originalRequest.headers) {
        const headers = originalRequest.headers as HeadersType;
        headers.Authorization = `Bearer ${newToken}`;
      }

      const instance = this.getInstanceOrThrow();
      const response = await instance.request(originalRequest);

      // Выполняем все ожидающие запросы
      for (const request of this.failedRequests) {
        const token = await this.getAuthToken();
        if (token && request.config.headers) {
          const headers = request.config.headers as HeadersType;
          headers.Authorization = `Bearer ${token}`;
        }
        try {
          const instanceForRequest = this.getInstanceOrThrow();
          const resp = await instanceForRequest.request(request.config);
          request.resolve(resp);
        } catch (err) {
          request.reject(err);
        }
      }

      this.failedRequests = [];

      return response;
    } catch (error) {
      for (const request of this.failedRequests) {
        request.reject(error);
      }
      this.failedRequests = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Попытка обновления токена
   */
  private static async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshTokenResult = await SecureStorageService.loadRefreshToken();

      if (!refreshTokenResult.success || !refreshTokenResult.data) {
        console.warn('[AxiosService] Refresh токен не найден');
        return false;
      }

      const refreshAxios = axios.create({
        baseURL: Config.API_URL,
        headers: {
          'Content-Type': 'application/json',
        } as HeadersType,
      });

      const response = await refreshAxios.post('/api/auth/refresh', {
        refreshToken: refreshTokenResult.data,
      });

      if (response.data.success && response.data.data?.accessToken) {
        await SecureStorageService.saveAccessToken(response.data.data.accessToken);

        if (response.data.data.refreshToken) {
          await SecureStorageService.saveRefreshToken(response.data.data.refreshToken);
        }

        this.setAuthHeader(response.data.data.accessToken);

        if (__DEV__) {
          console.log('[AxiosService] Токен успешно обновлен');
        }

        return true;
      }

      console.warn('[AxiosService] Не удалось обновить токен: некорректный ответ сервера');
      return false;
    } catch (error) {
      console.error('[AxiosService] Ошибка обновления токена:', error);
      return false;
    }
  }

  /**
   * Инициализация сервисов приложения
   */
  public static async initializeWithAppDefaults(
    axiosConfig: AxiosServiceConfig = {},
  ): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('🚀 Инициализация AxiosService с настройками приложения...');
      }

      this.initialize({
        timeout: axiosConfig.timeout || 30000,
        baseURL: Config.API_URL,
        withCredentials: axiosConfig.withCredentials,
        headers: {
          'X-Platform': Platform.OS,
          'X-App-Version': '1.0.0',
          'X-Device-Name': Platform.OS === 'ios' ? 'iOS' : 'Android',
          ...axiosConfig.headers,
        } as HeadersType,
      });

      if (__DEV__) {
        console.log('✅ AxiosService успешно инициализирован с настройками приложения');
      }
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации AxiosService:', error);
      return false;
    }
  }

  /**
   * Получить экземпляр axios
   */
  private static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.initialize();
    }
    if (!this.instance) {
      throw new Error('Не удалось инициализировать AxiosService');
    }
    return this.instance;
  }

  /**
   * GET запрос
   */
  public static async get<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    return instance.get<ApiResponse<T>, R>(url, config);
  }

  /**
   * POST запрос
   */
  public static async post<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    return instance.post<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * PUT запрос
   */
  public static async put<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    return instance.put<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * PATCH запрос
   */
  public static async patch<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    return instance.patch<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * DELETE запрос
   */
  public static async delete<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    return instance.delete<ApiResponse<T>, R>(url, config);
  }

  /**
   * Загрузить файл (multipart/form-data)
   */
  public static async upload<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const instance = this.getInstance();
    const uploadConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      } as HeadersType,
      ...config,
    };

    return instance.post<ApiResponse<T>, R>(url, formData, uploadConfig);
  }

  /**
   * Получить токен аутентификации из SecureStorageService
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const result = await SecureStorageService.loadAccessToken();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('[AxiosService] Ошибка получения токена:', error);
      return null;
    }
  }

  /**
   * Обработка ошибки 401 (Unauthorized)
   */
  private static async handleUnauthorized(): Promise<void> {
    try {
      console.warn('[AxiosService] 🔐 Сессия истекла или недействительна');

      // ✅ Флаг для предотвращения рекурсии
      if (this.isProcessingUnauthorized) {
        console.warn('[AxiosService] ⏳ Уже обрабатываем unauthorized');
        return;
      }

      this.isProcessingUnauthorized = true;

      // 1. Получаем номер телефона
      const phone = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);

      // 2. Пытаемся выполнить logout (без обработки ошибок)
      if (phone.success && phone.data) {
        try {
          // ✅ Отключаем интерцептор для этого запроса
          await this.post('/api/auth/logout', {
            phoneNumber: phone.data,
          }).catch(() => {
            // Игнорируем ошибки logout
            console.warn('[AxiosService] Logout запрос не удался, продолжаем очистку');
          });
        } catch {
          // Игнорируем любые ошибки
          console.warn('[AxiosService] Ошибка при logout, продолжаем очистку');
        }
      }

      // 3. ✅ Очищаем ВСЕ данные (с await)
      try {
        await SecureStorageService.clearAll();
        console.log('[AxiosService] ✅ Токены очищены');
      } catch (clearError) {
        console.error('[AxiosService] ❌ Ошибка очистки токенов:', clearError);
      }

      // 4. ✅ Сбрасываем состояние AxiosService
      try {
        await this.reset();
        console.log('[AxiosService] ✅ Состояние сброшено');
      } catch (resetError) {
        console.error('[AxiosService] ❌ Ошибка сброса состояния:', resetError);
        // Даже при ошибке - принудительно сбрасываем
        this.instance = null;
        this.isInitialized = false;
      }

      // 5. ✅ Очищаем заголовки
      if (this.instance) {
        try {
          delete this.instance.defaults.headers.common.Authorization;
        } catch {
          // Игнорируем
        }
      }

      // 6. ✅ Очищаем очередь запросов
      this.failedRequests = [];
      this.isRefreshing = false;

      // 7. ✅ Оповещаем приложение
      this.emitUnauthorized({
        timestamp: Date.now(),
        message: 'Сессия истекла или недействительна',
        code: 'SESSION_EXPIRED',
      });

      console.log('[AxiosService] ✅ Обработка unauthorized завершена');
    } catch (error) {
      console.error('[AxiosService] ❌ Критическая ошибка при обработке unauthorized:', error);

      // ✅ Даже при критической ошибке - пытаемся очистить данные
      try {
        await SecureStorageService.clearAll();
        this.instance = null;
        this.isInitialized = false;
        this.failedRequests = [];
        this.isRefreshing = false;
      } catch {
        // Игнорируем
      }
    } finally {
      this.isProcessingUnauthorized = false;
    }
  }

  /**
   * Отправка события истечения сессии
   */
  private static emitUnauthorized(event: UnauthorizedEvent): void {
    if (DeviceEventEmitter) {
      DeviceEventEmitter.emit(this.UNAUTHORIZED_EVENT, event);
    }
  }

  /**
   * Отправка события ошибки сети
   */
  private static emitNetworkError(error: AxiosError): void {
    if (DeviceEventEmitter) {
      DeviceEventEmitter.emit(this.NETWORK_ERROR_EVENT, {
        timestamp: Date.now(),
        message: error.message,
        code: error.code,
        url: error.config?.url,
      } as NetworkErrorEvent);
    }
  }

  /**
   * Отправка события ошибки сервера
   */
  private static emitServerError(error: AxiosError): void {
    console.error('[AxiosService] Ошибка сервера:', error.response?.status, error.config?.url);
  }

  /**
   * Отправка события завершения запроса
   */
  private static emitRequestCompleted(event: Omit<RequestCompletedEvent, 'timestamp'>): void {
    if (DeviceEventEmitter && __DEV__) {
      DeviceEventEmitter.emit(this.REQUEST_COMPLETED_EVENT, {
        ...event,
        timestamp: Date.now(),
      } as RequestCompletedEvent);
    }
  }

  /**
   * Установить заголовок аутентификации напрямую
   */
  public static setAuthHeader(token: string): void {
    const instance = this.getInstance();
    // Используем common для установки заголовка по умолчанию для всех запросов
    if (instance.defaults.headers.common) {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      // Для старых версий axios
      (instance.defaults.headers as HeadersType).Authorization = `Bearer ${token}`;
    }
  }

  /**
   * Проверить инициализацию
   */
  public static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 🔄 Сброс состояния AxiosService (при смене номера, выходе и т.д.)
   */
  public static async reset(): Promise<void> {
    try {
      console.log('🔄 Сброс AxiosService...');

      // 1. Очищаем заголовки
      if (this.instance) {
        if (this.instance.defaults.headers.common) {
          delete this.instance.defaults.headers.common.Authorization;
        } else {
          const headers = this.instance.defaults.headers as HeadersType;
          delete headers.Authorization;
        }
      }

      // 2. Сбрасываем состояние
      this.isRefreshing = false;
      this.failedRequests = [];

      // 3. Пересоздаем инстанс
      this.instance = null;
      this.isInitialized = false;

      // 4. Очищаем токены в SecureStorage
      await SecureStorageService.clearAll();

      console.log('✅ AxiosService успешно сброшен');
    } catch (error) {
      console.error('❌ Ошибка сброса AxiosService:', error);
      // Даже при ошибке - сбрасываем состояние
      this.instance = null;
      this.isInitialized = false;
      this.isRefreshing = false;
      this.failedRequests = [];
    }
  }

  /**
   * 🔄 Переинициализация (после сброса)
   */
  public static async reinitialize(): Promise<void> {
    await this.reset();
    await this.initializeWithAppDefaults();
    console.log('✅ AxiosService переинициализирован');
  }
}

export default AxiosService;
