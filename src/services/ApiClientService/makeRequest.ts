import { isAxiosError } from 'axios';
import AxiosService, { ApiResponse } from '../AxiosService';

// Тип для опций запроса
export type RequestOptions = {
  errorCodeCallBack?: (message?: string) => void;
  changeLoading?: (value: boolean) => void;
};

export type ApiMethod = {
  type: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'UPLOAD';
  url: string;
  params?: unknown;
  formData?: FormData;
};

// Универсальный метод для выполнения API запросов
export async function makeRequest<T>(
  method: ApiMethod,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const { errorCodeCallBack, changeLoading } = options || {};

  try {
    changeLoading?.(true);
    let response;
    switch (method.type) {
      case 'GET':
        response = await AxiosService.get(method.url, { params: method.params });
        break;
      case 'POST':
        response = await AxiosService.post(method.url, method.params);
        break;
      case 'PUT':
        response = await AxiosService.put(method.url, method.params);
        break;
      case 'PATCH':
        response = await AxiosService.patch(method.url, method.params);
        break;
      case 'DELETE':
        response = await AxiosService.delete(method.url);
        break;
      case 'UPLOAD':
        if (!method.formData) {
          throw new Error('Для метода UPLOAD требуется поле formData');
        }
        response = await AxiosService.upload(method.url, method.formData);
        break;
      default:
        throw new Error(`Неподдерживаемый тип метода: ${method.type as string}`);
    }

    const result: ApiResponse<T> = {
      data: response.data as T,
      success: response.status === 200 || response.data?.success !== false,
    };

    // Если есть data и success, пробуем извлечь данные из response.data.data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      result.data = response.data.data as T;
    }

    return result;
  } catch (error) {
    let errorMessage = 'Произошла ошибка при выполнении запроса';

    if (isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as Record<string, unknown>;
      errorMessage = typeof errorData.message === 'string' ? errorData.message : errorMessage;
      errorCodeCallBack?.(errorMessage);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCodeCallBack?.(errorMessage);
    }

    return {
      data: null,
      success: false,
      message: errorMessage,
    };
  } finally {
    changeLoading?.(false);
  }
}
