import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { TokenManager } from './tokenManager';

export class AxiosInterceptors {
  private static isRefreshing = false;
  private static failedRequests: Array<{
    resolve: (value: AxiosResponse) => void;
    reject: (error: unknown) => void;
    config: AxiosRequestConfig;
  }> = [];

  static setup(
    instance: AxiosInstance,
    tokenManager: TokenManager,
    refreshTokenCallback: () => Promise<boolean>
  ): void {
    // Request Interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const headers = config.headers || {};

        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }

        const token = await tokenManager.getAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        headers['X-Request-Timestamp'] = Date.now().toString();
        config.headers = headers;

        return config;
      },
      (error: AxiosError) => {
        console.error('[Axios] Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config;
        const startTime = parseInt(config.headers?.['X-Request-Timestamp'] || '0', 10);
        const duration = Date.now() - startTime;

        if (__DEV__) {
          console.log(`[Axios] ${response.status} ${config.url} - ${duration}ms`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          if (originalRequest.url?.includes('/api/auth/refresh')) {
            return Promise.reject(error);
          }

          try {
            return await this.handleTokenRefresh(originalRequest, instance, tokenManager, refreshTokenCallback);
          } catch {
            return Promise.reject(error);
          }
        }

        if (error.response?.status && error.response.status >= 500) {
          console.error('[Axios] Server error:', error.response.status);
        }

        return Promise.reject(error);
      }
    );
  }

  private static async handleTokenRefresh(
    originalRequest: AxiosRequestConfig,
    instance: AxiosInstance,
    tokenManager: TokenManager,
    refreshTokenCallback: () => Promise<boolean>
  ): Promise<AxiosResponse> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedRequests.push({ resolve, reject, config: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshSuccess = await refreshTokenCallback();

      if (!refreshSuccess) {
        throw new Error('Failed to refresh token');
      }

      const newToken = await tokenManager.getAccessToken();
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      const response = await instance.request(originalRequest);

      // Обрабатываем отложенные запросы
      for (const request of this.failedRequests) {
        const token = await tokenManager.getAccessToken();
        if (token && request.config.headers) {
          request.config.headers.Authorization = `Bearer ${token}`;
        }
        try {
          const resp = await instance.request(request.config);
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

  static reset(): void {
    this.isRefreshing = false;
    this.failedRequests = [];
  }
}
