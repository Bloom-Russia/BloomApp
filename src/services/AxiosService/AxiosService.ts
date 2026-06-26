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

    this.instance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        const headers = (requestConfig.headers || {}) as HeadersType;

        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }

        const token = await this.getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        headers['X-Request-Timestamp'] = Date.now().toString();
        requestConfig.headers = headers as typeof requestConfig.headers;

        return requestConfig;
      },
      (error: AxiosError) => {
        console.error('[Axios] Ошибка запроса:', error.message);
        this.emitNetworkError(error);
        return Promise.reject(error);
      },
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const headers = response.config.headers as HeadersType;
        const timestamp = headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        if (__DEV__) {
          console.log(`[Axios] ${response.status} ${response.config.url} - ${duration}ms`);
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

        if (error.response?.status === 401 && originalRequest) {
          if (originalRequest.url?.includes('/api/auth/refresh')) {
            await this.handleUnauthorized();
            return Promise.reject(error);
          }

          try {
            return await this.handleTokenRefresh(originalRequest);
          } catch {
            await this.handleUnauthorized();
            return Promise.reject(error);
          }
        }

        this.emitNetworkError(error);

        if (error.response?.status && error.response.status >= 500) {
          console.error('[Axios] Ошибка сервера:', error.response.status);
        }

        return Promise.reject(error);
      },
    );

    this.isInitialized = true;

    if (__DEV__) {
      console.log('[AxiosService] Инициализирован');
    }
  }

  private static getInstanceOrThrow(): AxiosInstance {
    if (!this.instance) {
      throw new Error('AxiosService не инициализирован');
    }
    return this.instance;
  }

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
        (originalRequest.headers as HeadersType).Authorization = `Bearer ${newToken}`;
      }

      const instance = this.getInstanceOrThrow();
      const response = await instance.request(originalRequest);

      for (const request of this.failedRequests) {
        const token = await this.getAuthToken();
        if (token && request.config.headers) {
          (request.config.headers as HeadersType).Authorization = `Bearer ${token}`;
        }
        try {
          const resp = await this.getInstanceOrThrow().request(request.config);
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

  private static async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshTokenResult = await SecureStorageService.loadRefreshToken();

      if (!refreshTokenResult.success || !refreshTokenResult.data) {
        console.warn('[Axios] Refresh токен не найден');
        return false;
      }

      const refreshAxios = axios.create({
        baseURL: Config.API_URL,
        headers: { 'Content-Type': 'application/json' } as HeadersType,
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
          console.log('[Axios] Токен обновлен');
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('[Axios] Ошибка обновления токена:', error);
      return false;
    }
  }

  public static async initializeWithAppDefaults(
    axiosConfig: AxiosServiceConfig = {},
  ): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('🚀 Инициализация AxiosService...');
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
        console.log('✅ AxiosService инициализирован');
      }
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации AxiosService:', error);
      return false;
    }
  }

  private static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.initialize();
    }
    if (!this.instance) {
      throw new Error('Не удалось инициализировать AxiosService');
    }
    return this.instance;
  }

  public static async get<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().get<ApiResponse<T>, R>(url, config);
  }

  public static async post<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    params?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().post<ApiResponse<T>, R>(url, params, config);
  }

  public static async put<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    params?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().put<ApiResponse<T>, R>(url, params, config);
  }

  public static async patch<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    params?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().patch<ApiResponse<T>, R>(url, params, config);
  }

  public static async delete<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.getInstance().delete<ApiResponse<T>, R>(url, config);
  }

  public static async upload<T = unknown, R = AxiosResponse<ApiResponse<T>>>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const uploadConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      } as HeadersType,
      ...config,
    };

    return this.getInstance().post<ApiResponse<T>, R>(url, formData, uploadConfig);
  }

  private static async getAuthToken(): Promise<string | null> {
    try {
      const result = await SecureStorageService.loadAccessToken();
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('[Axios] Ошибка получения токена:', error);
      return null;
    }
  }

  private static async handleUnauthorized(): Promise<void> {
    if (this.isProcessingUnauthorized) {
      console.warn('[Axios] Уже обрабатываем unauthorized');
      return;
    }

    this.isProcessingUnauthorized = true;

    try {
      console.warn('[Axios] Сессия истекла');

      const phone = await SecureStorageService.getValue(SecureStorageKeys.PHONE_NUMBER);

      if (phone.success && phone.data) {
        try {
          await this.post('/api/auth/logout', { phoneNumber: phone.data });
        } catch {
          // Игнорируем ошибку logout
        }
      }

      await SecureStorageService.clearAll();
      await this.reset();

      if (this.instance) {
        delete this.instance.defaults.headers.common.Authorization;
      }

      this.failedRequests = [];
      this.isRefreshing = false;

      this.emitUnauthorized({
        timestamp: Date.now(),
        message: 'Сессия истекла',
        code: 'SESSION_EXPIRED',
      });

      console.log('[Axios] Unauthorized обработан');
    } catch (error) {
      console.error('[Axios] Ошибка обработки unauthorized:', error);
      await SecureStorageService.clearAll();
      this.instance = null;
      this.isInitialized = false;
      this.failedRequests = [];
      this.isRefreshing = false;
    } finally {
      this.isProcessingUnauthorized = false;
    }
  }

  private static emitUnauthorized(event: UnauthorizedEvent): void {
    if (DeviceEventEmitter) {
      DeviceEventEmitter.emit(this.UNAUTHORIZED_EVENT, event);
    }
  }

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

  private static emitRequestCompleted(event: Omit<RequestCompletedEvent, 'timestamp'>): void {
    if (DeviceEventEmitter && __DEV__) {
      DeviceEventEmitter.emit(this.REQUEST_COMPLETED_EVENT, {
        ...event,
        timestamp: Date.now(),
      } as RequestCompletedEvent);
    }
  }

  public static setAuthHeader(token: string): void {
    const instance = this.getInstance();
    if (instance.defaults.headers.common) {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      (instance.defaults.headers as HeadersType).Authorization = `Bearer ${token}`;
    }
  }

  public static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public static async reset(): Promise<void> {
    try {
      console.log('🔄 Сброс AxiosService...');

      if (this.instance) {
        delete this.instance.defaults.headers.common?.Authorization;
      }

      this.isRefreshing = false;
      this.failedRequests = [];
      this.instance = null;
      this.isInitialized = false;

      await SecureStorageService.clearAll();

      console.log('✅ AxiosService сброшен');
    } catch (error) {
      console.error('❌ Ошибка сброса AxiosService:', error);
      this.instance = null;
      this.isInitialized = false;
      this.isRefreshing = false;
      this.failedRequests = [];
    }
  }
}

export default AxiosService;
