import { ApiClient } from '@data/datasources/remote/api/client';
import { ApiResponse } from '@data/datasources/remote/dto/ApiResponse';
import { SecureStorageRepositoryImpl } from '@data/repositories/SecureStorageRepositoryImpl';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

class AxiosService {
  private static secureStorage = new SecureStorageRepositoryImpl();

  static async initializeWithAppDefaults(_config?: { timeout?: number }): Promise<boolean> {
    try {
      ApiClient.initialize();
      return true;
    } catch (error) {
      console.error('❌ Error initializing ApiClient:', error);
      return false;
    }
  }

  static async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.get<T>(url, config);
  }

  static async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.post<T>(url, data, config);
  }

  static async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.put<T>(url, data, config);
  }

  static async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.patch<T>(url, data, config);
  }

  static async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.delete<T>(url, config);
  }

  static async upload<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return ApiClient.upload<T>(url, formData, config);
  }

  static async reset(): Promise<void> {
    await this.secureStorage.clearAllAuthData();
    ApiClient.reset();
  }
}

export default AxiosService;
