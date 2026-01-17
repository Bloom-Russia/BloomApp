import { CONFIG } from '@config';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { DeviceEventEmitter, Platform } from 'react-native';
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
      baseURL: CONFIG.API_URL,
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
        // Логирование запроса
        if (__DEV__) {
          console.log(
            `[Axios Запрос] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
            {
              data: requestConfig.data,
              headers: requestConfig.headers,
            },
          );
        }

        // Добавление заголовков аутентификации
        const token = await this.getAuthToken();
        if (token && requestConfig.headers) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        // Добавление временной метки для отслеживания
        if (requestConfig.headers) {
          requestConfig.headers['X-Request-Timestamp'] = Date.now().toString();
        }

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
      (error: AxiosError) => {
        const timestamp = error.config?.headers?.['X-Request-Timestamp'];
        const duration = Date.now() - parseInt(timestamp || '0', 10);

        console.error('[Axios Ошибка Ответа]', {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method,
          message: error.message,
          duration: `${duration}мс`,
          data: error.response?.data,
        });

        // Отправка события ошибки сети
        this.emitNetworkError(error);

        // Обработка ошибок аутентификации
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

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
        baseURL: CONFIG.API_URL,
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
   * @deprecated Используйте initializeWithAppDefaults для лучшей читаемости
   */
  public static async initializeAppServices(
    axiosConfig: AxiosServiceConfig = {},
  ): Promise<boolean> {
    return this.initializeWithAppDefaults(axiosConfig);
  }

  /**
   * @deprecated Используйте initializeWithAppDefaults
   */
  public static async initializeService(axiosConfig: AxiosServiceConfig = {}): Promise<boolean> {
    return this.initializeWithAppDefaults(axiosConfig);
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
  private static handleUnauthorized(): void {
    SecureStorageService.clearAllTokens()
      .then(() => {
        console.warn('[AxiosService] Сессия истекла. Токены очищены.');
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
   * Подписаться на событие истечения сессии
   */
  public static onUnauthorized(callback: (event: UnauthorizedEvent) => void): () => void {
    if (DeviceEventEmitter) {
      const subscription = DeviceEventEmitter.addListener(this.UNAUTHORIZED_EVENT, callback);

      // Возвращаем функцию для отписки
      return () => subscription.remove();
    }

    // Пустая функция для отписки, если DeviceEventEmitter не доступен
    return () => {
      // Пустая функция для отписки
    };
  }

  /**
   * Подписаться на событие ошибки сети
   */
  public static onNetworkError(callback: (event: NetworkErrorEvent) => void): () => void {
    if (DeviceEventEmitter) {
      const subscription = DeviceEventEmitter.addListener(this.NETWORK_ERROR_EVENT, callback);

      return () => subscription.remove();
    }

    return () => {
      // Пустая функция для отписки
    };
  }

  /**
   * Подписаться на событие завершения запроса
   */
  public static onRequestCompleted(callback: (event: RequestCompletedEvent) => void): () => void {
    if (DeviceEventEmitter && __DEV__) {
      const subscription = DeviceEventEmitter.addListener(this.REQUEST_COMPLETED_EVENT, callback);

      return () => subscription.remove();
    }

    return () => {
      // Пустая функция для отписки
    };
  }

  /**
   * Установить базовый URL
   */
  public static setBaseURL(baseURL: string): void {
    const instance = this.getInstance();
    instance.defaults.baseURL = baseURL;

    if (__DEV__) {
      console.log('[AxiosService] Базовый URL обновлен:', baseURL);
    }
  }

  /**
   * Установить таймаут
   */
  public static setTimeout(timeout: number): void {
    const instance = this.getInstance();
    instance.defaults.timeout = timeout;

    if (__DEV__) {
      console.log('[AxiosService] Таймаут обновлен:', timeout);
    }
  }

  /**
   * Добавить заголовки
   */
  public static setHeaders(headers: Record<string, string>): void {
    const instance = this.getInstance();
    if (instance.defaults.headers) {
      instance.defaults.headers = {
        ...instance.defaults.headers,
        ...headers,
      };
    }

    if (__DEV__) {
      console.log('[AxiosService] Заголовки обновлены:', headers);
    }
  }

  /**
   * Установить заголовок аутентификации напрямую
   * (альтернатива автоматическому получению из SecureStorage)
   */
  public static setAuthHeader(token: string): void {
    const instance = this.getInstance();
    if (instance.defaults.headers) {
      instance.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }

  /**
   * Очистить заголовок аутентификации
   */
  public static clearAuthHeader(): void {
    const instance = this.getInstance();
    if (instance.defaults.headers) {
      // Вместо delete используем присвоение undefined
      instance.defaults.headers.Authorization = undefined as unknown as string;
    }
  }

  /**
   * Проверить инициализацию
   */
  public static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Получить текущую конфигурацию
   */
  public static getConfig(): AxiosServiceConfig {
    const instance = this.getInstance();
    const { headers } = instance.defaults;

    return {
      baseURL: instance.defaults.baseURL as string,
      timeout: instance.defaults.timeout,
      headers: headers ? (headers as Record<string, string>) : {},
      withCredentials: instance.defaults.withCredentials,
    };
  }

  /**
   * Очистить все настройки и сбросить экземпляр
   */
  public static reset(): void {
    if (this.instance) {
      // Очищаем интерцепторы
      this.instance.interceptors.request.clear();
      this.instance.interceptors.response.clear();
      this.instance = null;
    }
    this.isInitialized = false;

    if (__DEV__) {
      console.log('[AxiosService] Сброс выполнен');
    }
  }

  /**
   * Создать новый экземпляр с другой конфигурацией
   */
  public static createNewInstance(config: AxiosServiceConfig): AxiosInstance {
    return axios.create({
      baseURL: config.baseURL || 'https://api.example.com',
      timeout: config.timeout || 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
      withCredentials: config.withCredentials || false,
    });
  }

  /**
   * Отменить все активные запросы
   */
  public static cancelAllRequests(): void {
    // Эта функция может быть реализована с использованием CancelToken
    // если нужно добавить функционал отмены запросов
    console.warn(
      '[AxiosService] cancelAllRequests не реализован. Используйте CancelToken при необходимости.',
    );
  }

  /**
   * Получить экземпляр Axios для прямого использования
   */
  public static get axiosInstance(): AxiosInstance {
    return this.getInstance();
  }
}

export default AxiosService;

// ПРИМЕР ИСПОЛЬЗОВАНИЯ
// services/UserService.ts
// import AxiosService from './AxiosService';
//
// export interface User {
//     id: number;
//     name: string;
//     email: string;
//     avatar?: string;
// }
//
// export interface LoginCredentials {
//     email: string;
//     password: string;
// }
//
// export interface RegistrationData {
//     name: string;
//     email: string;
//     password: string;
//     confirmPassword: string;
// }
//
// export interface ApiResponse<T> {
//     success: boolean;
//     data?: T;
//     message?: string;
//     error?: string;
// }
//
// class UserService {
//     private static readonly BASE_URL = '/api/v1/users';
//
//     /**
//      * Получить список пользователей
//      */
//     static async getUsers(page = 1, limit = 20): Promise<ApiResponse<User[]>> {
//         try {
//             const response = await AxiosService.get(`${this.BASE_URL}`, {
//                 params: { page, limit }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при получении пользователей:', error);
//             throw error;
//         }
//     }
//
//     /**
//      * Получить пользователя по ID
//      */
//     static async getUserById(id: number): Promise<ApiResponse<User>> {
//         try {
//             const response = await AxiosService.get(`${this.BASE_URL}/${id}`);
//             return response.data;
//         } catch (error) {
//             console.error(`Ошибка при получении пользователя ${id}:`, error);
//             throw error;
//         }
//     }
//
//     /**
//      * Вход в систему
//      */
//     static async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
//         try {
//             const response = await AxiosService.post('/api/v1/auth/login', credentials);
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при входе:', error);
//             throw error;
//         }
//     }
//
//     /**
//      * Регистрация
//      */
//     static async register(data: RegistrationData): Promise<ApiResponse<User>> {
//         try {
//             const response = await AxiosService.post('/api/v1/auth/register', data);
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при регистрации:', error);
//             throw error;
//         }
//     }
//
//     /**
//      * Обновить профиль
//      */
//     static async updateProfile(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
//         try {
//             const response = await AxiosService.put(`${this.BASE_URL}/${userId}`, userData);
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при обновлении профиля:', error);
//             throw error;
//         }
//     }
//
//     /**
//      * Загрузить аватар
//      */
//     static async uploadAvatar(userId: number, imageUri: string): Promise<ApiResponse<{ avatarUrl: string }>> {
//         try {
//             const formData = new FormData();
//
//             // Преобразуем URI в файл (для React Native)
//             const filename = imageUri.split('/').pop() || 'avatar.jpg';
//             const match = /\.(\w+)$/.exec(filename);
//             const type = match ? `image/${match[1]}` : 'image/jpeg';
//
//             // @ts-ignore - для React Native
//             formData.append('avatar', {
//                 uri: imageUri,
//                 name: filename,
//                 type,
//             });
//
//             const response = await AxiosService.upload(
//                 `${this.BASE_URL}/${userId}/avatar`,
//                 formData
//             );
//
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при загрузке аватара:', error);
//             throw error;
//         }
//     }
//
//     /**
//      * Удалить пользователя
//      */
//     static async deleteUser(userId: number): Promise<ApiResponse<void>> {
//         try {
//             const response = await AxiosService.delete(`${this.BASE_URL}/${userId}`);
//             return response.data;
//         } catch (error) {
//             console.error(`Ошибка при удалении пользователя ${userId}:`, error);
//             throw error;
//         }
//     }
//
//     /**
//      * Поиск пользователей
//      */
//     static async searchUsers(query: string): Promise<ApiResponse<User[]>> {
//         try {
//             const response = await AxiosService.get(`${this.BASE_URL}/search`, {
//                 params: { q: query }
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка при поиске пользователей:', error);
//             throw error;
//         }
//     }
// }
//
// export default UserService;

// screens/ProfileScreen.tsx
// const ProfileScreen = ({ userId }: { userId: number }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [name, setName] = useState('');
//
//   useEffect(() => {
//     loadUserProfile();
//   }, [userId]);
//
//   const loadUserProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//
//       const response = await UserService.getUserById(userId);
//
//       if (response.success && response.data) {
//         setUser(response.data);
//         setName(response.data.name);
//       } else {
//         setError(response.message || 'Не удалось загрузить профиль');
//       }
//     } catch (error) {
//       console.error('Ошибка:', error);
//       setError('Произошла ошибка при загрузке профиля');
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleUpdateProfile = async () => {
//     try {
//       if (!user) return;
//
//       const response = await UserService.updateProfile(user.id, { name });
//
//       if (response.success && response.data) {
//         setUser(response.data);
//         setIsEditing(false);
//         alert('Профиль успешно обновлен!');
//       } else {
//         alert(response.message || 'Ошибка при обновлении');
//       }
//     } catch (error) {
//       console.error('Ошибка при обновлении:', error);
//       alert('Не удалось обновить профиль');
//     }
//   };
//
//   const handleUploadAvatar = async () => {
//     // Использование ImagePicker для выбора изображения
//     // const result = await ImagePicker.launchImageLibraryAsync({...});
//     // if (!result.canceled) {
//     //   const uploadResponse = await UserService.uploadAvatar(userId, result.uri);
//     //   if (uploadResponse.success) {
//     //     loadUserProfile(); // Перезагрузить данные
//     //   }
//     // }
//   };
//
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <Text>Загрузка профиля...</Text>
//       </View>
//     );
//   }
//
//   if (error) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
//         <Button title="Повторить" onPress={loadUserProfile} />
//       </View>
//     );
//   }
//
//   if (!user) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Пользователь не найден</Text>
//       </View>
//     );
//   }
//
//   return (
//     <View style={{ flex: 1, padding: 16 }}>
//       <View style={{ alignItems: 'center', marginBottom: 24 }}>
//         {user.avatar ? (
//           <Image
//             source={{ uri: user.avatar }}
//             style={{ width: 100, height: 100, borderRadius: 50 }}
//           />
//         ) : (
//           <View
//             style={{
//               width: 100,
//               height: 100,
//               borderRadius: 50,
//               backgroundColor: '#ccc',
//               justifyContent: 'center',
//               alignItems: 'center',
//             }}
//           >
//             <Text style={{ fontSize: 24 }}>{user.name.charAt(0)}</Text>
//           </View>
//         )}
//         <Button title="Сменить аватар" onPress={handleUploadAvatar} />
//       </View>
//
//       {isEditing ? (
//         <>
//           <TextInput
//             value={name}
//             onChangeText={setName}
//             placeholder="Имя"
//             style={{ borderWidth: 1, padding: 8, marginBottom: 16 }}
//           />
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//             <Button title="Сохранить" onPress={handleUpdateProfile} />
//             <Button title="Отмена" onPress={() => setIsEditing(false)} color="gray" />
//           </View>
//         </>
//       ) : (
//         <>
//           <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{user.name}</Text>
//           <Text style={{ fontSize: 16, color: 'gray', marginBottom: 16 }}>{user.email}</Text>
//           <Button title="Редактировать" onPress={() => setIsEditing(true)} />
//         </>
//       )}
//     </View>
//   );
// };

// config/api.ts
// import AxiosService from '../services/AxiosService';
//
// export const configureApiForEnvironment = () => {
//     if (__DEV__) {
//         // Настройки для разработки
//         AxiosService.setBaseURL('https://dev-api.example.com');
//         AxiosService.setHeaders({
//             'X-Debug-Mode': 'true',
//             'X-Environment': 'development'
//         });
//
//         // Включаем логирование всех запросов
//         AxiosService.onRequestCompleted((event) => {
//             console.log(`📡 ${event.method} ${event.url}: ${event.status} (${event.duration}ms)`);
//         });
//
//     } else if (process.env.NODE_ENV === 'staging') {
//         // Настройки для staging
//         AxiosService.setBaseURL('https://staging-api.example.com');
//
//     } else {
//         // Настройки для production
//         AxiosService.setBaseURL('https://api.example.com');
//     }
//
//     // Общие настройки
//     AxiosService.setTimeout(30000);
//     AxiosService.setHeaders({
//         'X-App-Version': '1.0.0',
//         'X-Platform': Platform.OS
//     });
// };
