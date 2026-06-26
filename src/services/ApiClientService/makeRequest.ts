import { isAxiosError } from 'axios';
import AxiosService, { ApiResponse } from '../AxiosService';

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
        throw new Error(`Неподдерживаемый тип метода: ${method.type}`);
    }

    const responseData = response.data as ApiResponse<T>;

    return {
      data: responseData.data as T,
      success: responseData.success !== false,
      message: responseData.message,
      errors: responseData.errors,
    } as ApiResponse<T>;
  } catch (error) {
    let errorMessage = 'Произошла ошибка при выполнении запроса';

    if (isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as Record<string, unknown>;
      errorMessage = typeof errorData.message === 'string' ? errorData.message : errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    errorCodeCallBack?.(errorMessage);

    return {
      data: null as T,
      success: false,
      message: errorMessage,
    };
  } finally {
    changeLoading?.(false);
  }
}
