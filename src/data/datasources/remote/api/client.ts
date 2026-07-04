import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import { ApiResponse } from '../dto/ApiResponse';
import { AxiosInterceptors } from './interceptors';
import { TokenManager } from './tokenManager';

export class ApiClient {
  private static instance: AxiosInstance | null = null;
  private static tokenManager = TokenManager.getInstance();

  static initialize(): void {
    if (this.instance) {
      console.warn('[ApiClient] Already initialized');
      return;
    }

    this.instance = axios.create({
      baseURL: Config.API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Platform': Platform.OS,
        'X-App-Version': '1.0.0',
      },
      withCredentials: false,
    });

    // Настройка интерцепторов
    AxiosInterceptors.setup(this.instance, this.tokenManager, this.refreshToken.bind(this));

    console.log('[ApiClient] Initialized');
  }

  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.initialize();
    }
    if (!this.instance) {
      throw new Error('[ApiClient] Not initialized');
    }
    return this.instance;
  }

  private static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.tokenManager.getRefreshToken();
      if (!refreshToken) {
        console.warn('[ApiClient] No refresh token available');
        return false;
      }

      const instance = this.getInstance();
      const response = await instance.post('/api/auth/refresh', { refreshToken });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      await this.tokenManager.saveTokens(accessToken, newRefreshToken);
      this.setAuthHeader(accessToken);
      return true;
    } catch (error) {
      console.error('[ApiClient] Token refresh failed:', error);
      return false;
    }
  }

  // ✅ ДОБАВЛЯЕМ МЕТОД setAuthHeader
  static setAuthHeader(token: string): void {
    const instance = this.getInstance();
    if (instance.defaults.headers.common) {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      (instance.defaults.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  // HTTP методы с типизацией
  static async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().get<ApiResponse<T>>(url, config);
  }

  static async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().post<ApiResponse<T>>(url, data, config);
  }

  static async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().put<ApiResponse<T>>(url, data, config);
  }

  static async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().patch<ApiResponse<T>>(url, data, config);
  }

  static async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().delete<ApiResponse<T>>(url, config);
  }

  static async upload<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.getInstance().post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  }

  static reset(): void {
    AxiosInterceptors.reset();
    this.instance = null;
  }
}
