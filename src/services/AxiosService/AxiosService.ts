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
} from './types'; // Определяем тип для глобальной переменной __DEV__

// Определяем тип для глобальной переменной __DEV__
declare const __DEV__: boolean;

class AxiosService {
  private static instance: AxiosInstance | null = null;
  private static isInitialized = false;
  private static isRefreshing = false;
  private static failedRequests: Array<{
    resolve: (value: AxiosResponse) => void;
    reject: (error: unknown) => void;
    config: AxiosRequestConfig;
  }> = [];

  // Константы для ключей событий
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
      },
      withCredentials: axiosConfig.withCredentials || false,
    });

    // Интерцептор запросов
    this.instance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        // Гарантируем наличие заголовков (InternalAxiosRequestConfig уже гарантирует это)
        // но добавляем проверку для TypeScript
        if (!requestConfig.headers) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          requestConfig.headers = {};
        }

        // Устанавливаем Content-Type по умолчанию для всех запросов
        if (!requestConfig.headers['Content-Type']) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }

        // Добавление заголовков аутентификации
        const token = await this.getAuthToken();
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        // Добавление временной метки для отслеживания
        requestConfig.headers['X-Request-Timestamp'] = Date.now().toString();

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
        const timestamp = response.config.headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        if (__DEV__) {
          console.log(`[Axios Ответ] ${response.status} ${response.config.url}`, {
            duration: `${duration}мс`,
            data: response.data,
          });
        }

        // Отправка события завершения запроса
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
        const timestamp = originalRequest?.headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        console.error('[Axios Ошибка Ответа]', {
          status: error.response?.status,
          url: originalRequest?.url,
          method: originalRequest?.method,
          message: error.message,
          duration: `${duration}мс`,
          data: error.response?.data,
        });

        // Обработка ошибок аутентификации
        if (error.response?.status === 401 && originalRequest) {
          // Исключаем эндпоинт обновления токена из обработки
          if (originalRequest.url?.includes('/api/auth/refresh')) {
            await this.handleUnauthorized();
            return Promise.reject(error);
          }

          // Пробуем обновить токен и повторить запрос
          try {
            return await this.handleTokenRefresh(originalRequest);
          } catch (refreshError) {
            await this.handleUnauthorized();
            return Promise.reject(refreshError);
          }
        }

        // Отправка события ошибки сети
        this.emitNetworkError(error);

        // Обработка ошибок сервера
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
   * Обработка обновления токена
   */
  private static async handleTokenRefresh(
    originalRequest: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    // Если уже обновляем токен, добавляем запрос в очередь
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedRequests.push({ resolve, reject, config: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      // Пробуем обновить токен
      const refreshSuccess = await this.tryRefreshToken();

      if (!refreshSuccess) {
        throw new Error('Не удалось обновить токен');
      }

      // Обновляем заголовок авторизации в оригинальном запросе
      const newToken = await this.getAuthToken();
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      // Повторяем оригинальный запрос
      const response = await this.instance!.request(originalRequest);

      // Выполняем все ожидающие запросы
      this.failedRequests.forEach((request) => {
        const token = this.getAuthToken();
        if (token && request.config.headers) {
          request.config.headers.Authorization = `Bearer ${token}`;
        }
        this.instance!.request(request.config).then(request.resolve).catch(request.reject);
      });

      // Очищаем очередь
      this.failedRequests = [];

      return response;
    } catch (error) {
      // Обрабатываем ошибки для всех ожидающих запросов
      this.failedRequests.forEach((request) => request.reject(error));
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

      // Создаем временный экземпляр axios без интерцепторов для обновления токена
      const refreshAxios = axios.create({
        baseURL: Config.API_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await refreshAxios.post('/api/auth/refresh', {
        refreshToken: refreshTokenResult.data,
      });

      if (response.data.success && response.data.data?.accessToken) {
        // Сохраняем новый токен
        await SecureStorageService.saveAccessToken(response.data.data.accessToken);

        // Если есть новый refresh токен, сохраняем его
        if (response.data.data.refreshToken) {
          await SecureStorageService.saveRefreshToken(response.data.data.refreshToken);
        }

        // Обновляем заголовок в основном экземпляре
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
   * Инициализация сервисов приложения с автоматическим добавлением платформенных заголовков
   */
  public static async initializeWithAppDefaults(
    axiosConfig: AxiosServiceConfig = {},
  ): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('🚀 Инициализация AxiosService с настройками приложения...');
      }

      // Инициализируем AxiosService с платформенными заголовками
      this.initialize({
        timeout: axiosConfig.timeout || 30000,
        baseURL: Config.API_URL,
        withCredentials: axiosConfig.withCredentials,
        headers: {
          'X-Platform': Platform.OS,
          'X-App-Version': '1.0.0',
          'X-Device-Name': Platform.OS === 'ios' ? 'iOS' : 'Android',
          ...axiosConfig.headers,
        },
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
      // Автоматическая инициализация с настройками по умолчанию
      this.initialize();
    }
    return this.instance as AxiosInstance;
  }

  /**
   * GET запрос
   */
  public static async get<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().get<ApiResponse<T>, R>(url, config);
  }

  /**
   * POST запрос
   */
  public static async post<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().post<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * PUT запрос
   */
  public static async put<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().put<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * PATCH запрос
   */
  public static async patch<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().patch<ApiResponse<T>, R>(url, data, config);
  }

  /**
   * DELETE запрос
   */
  public static async delete<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().delete<ApiResponse<T>, R>(url, config);
  }

  /**
   * Загрузить файл (multipart/form-data)
   */
  public static async upload<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const uploadConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    };

    return this.getInstance().post<ApiResponse<T>, R>(url, formData, uploadConfig);
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
    const phone = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);
    if (phone.success && phone.data) {
      await this.post('/api/auth/logout', {
        phoneNumber: phone.data,
      });
      SecureStorageService.clearAll()
        .then(() => {
          console.warn('[AxiosService] Сессия истекла. Токены очищены.');
          // TODO выход из приложения
        })
        .catch((clearError: unknown) => {
          console.error('[AxiosService] Ошибка очистки токенов:', clearError);
        });
      // Отправка события истечения сессии
      this.emitUnauthorized({
        timestamp: Date.now(),
        message: 'Сессия истекла',
        code: 'SESSION_EXPIRED',
      });
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
    // Можно добавить отдельное событие для ошибок сервера
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
   * (альтернатива автоматическому получению из SecureStorage)
   */
  public static setAuthHeader(token: string): void {
    const instance = this.getInstance();
    instance.defaults.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * Проверить инициализацию
   */
  public static isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

export default AxiosService;
