import { User } from '@domain/entities/User';
import type { IAuthRepository } from '@domain/repositories/IAuthRepository';
import type { ISecureStorageRepository } from '@domain/repositories/ISecureStorageRepository';
import { CheckAuthStatusUseCase } from '@domain/usecases/auth/CheckAuthStatusUseCase';
import { SetAuthStatusUseCase } from '@domain/usecases/auth/SetAuthStatusUseCase';
import { inject, injectable } from 'inversify';
import { noop } from 'lodash';
import { makeAutoObservable, runInAction } from 'mobx';

/**
 * AuthStore - ViewModel для управления аутентификацией
 *
 * Отвечает за:
 * - Состояние авторизации пользователя
 * - Верификацию по телефону
 * - Управление токенами
 * - Работу с SecureStorage
 * - Навигацию (через флаги)
 */
@injectable()
export class AuthStore {
  /** Текущий пользователь */
  user: User | null = null;

  /** Флаг верификации пользователя */
  isVerified: boolean = false;

  /** Флаг аутентификации (есть токен) */
  isAuthenticated: boolean = false;

  /** Индикатор загрузки */
  isLoading: boolean = true;

  /** Сообщение об ошибке */
  error: string | null = null;

  /** Флаг отправки кода подтверждения */
  isCodeSent: boolean = false;

  /** Номер телефона пользователя */
  phoneNumber: string = '';

  private authRepository: IAuthRepository;
  private secureStorage: ISecureStorageRepository;
  private checkAuthStatusUseCase: CheckAuthStatusUseCase;
  private setAuthStatusUseCase: SetAuthStatusUseCase;

  constructor(
    @inject('IAuthRepository') authRepository: IAuthRepository,
    @inject('ISecureStorageRepository') secureStorage: ISecureStorageRepository,
  ) {
    this.authRepository = authRepository;
    this.secureStorage = secureStorage;

    makeAutoObservable(this, {
      authRepository: false,
      secureStorage: false,
      rootStore: false,
      checkAuthStatusUseCase: false,
      setAuthStatusUseCase: false,
    } as any);

    this.checkAuthStatusUseCase = new CheckAuthStatusUseCase(authRepository);
    this.setAuthStatusUseCase = new SetAuthStatusUseCase(authRepository);
    this.loadAuthStatus().then(noop);
  }

  /**
   * Загрузка статуса авторизации при старте приложения
   */
  async loadAuthStatus(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const result = await this.checkAuthStatusUseCase.execute();

    runInAction(() => {
      this.isLoading = false;
      if (result.isSuccess && result.data) {
        this.isVerified = result.data.isVerified;
        this.isAuthenticated = result.data.isVerified;
        if (this.isVerified) {
          this.loadUser();
        }
      } else {
        this.setError(this.getErrorMessage(result.error));
        this.isVerified = false;
        this.isAuthenticated = false;
      }
    });
  }

  /**
   * Установка статуса верификации
   * @param value - статус верификации
   */
  async setVerified(value: boolean): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const result = await this.setAuthStatusUseCase.execute({ isVerified: value });

    runInAction(() => {
      this.isLoading = false;
      if (result.isSuccess) {
        this.isVerified = value;
        this.isAuthenticated = value;
        if (!value) {
          this.user = null;
        }
      } else {
        this.setError(this.getErrorMessage(result.error));
      }
    });
  }

  /**
   * Запрос кода верификации
   * @param phone - номер телефона
   */
  async requestVerificationCode(phone: string): Promise<boolean> {
    await this.secureStorage.savePhoneNumber(phone);

    this.phoneNumber = phone;
    this.setLoading(true);
    this.setError(null);
    this.resetCodeSentStatus();

    try {
      const fcmToken = await this.authRepository.getFCMToken();
      if (!fcmToken) {
        throw new Error('auth.errors.FCM_TOKEN_NOT_RECEIVED');
      }

      await this.authRepository.requestVerificationCode({
        phoneNumber: phone,
        fcmToken,
      });

      runInAction(() => {
        this.isLoading = false;
        this.isCodeSent = true;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.setError(this.getErrorMessage(error));
      });
      return false;
    }
  }

  /**
   * Верификация кода подтверждения
   * @param code - код из SMS
   */
  async verifyCode(code: string): Promise<boolean> {
    if (!this.phoneNumber || this.phoneNumber.length < 10) {
      this.setError('auth.errors.invalidPhone');
      return false;
    }

    this.setLoading(true);
    this.setError(null);

    try {
      const result = await this.authRepository.verifyCode({
        phoneNumber: this.phoneNumber,
        code,
      });

      const refreshToken = (result as any).refreshToken || '';

      runInAction(() => {
        this.isLoading = false;
        this.isVerified = true;
        this.isAuthenticated = true;
        this.user = result.user;
        this.isCodeSent = false;
      });

      await this.secureStorage.saveAllAuthData({
        accessToken: result.token,
        refreshToken: refreshToken,
        phoneNumber: this.phoneNumber,
        isVerified: true,
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.setError(this.getErrorMessage(error));
      });
      return false;
    }
  }

  /**
   * Выход из аккаунта
   */
  async logout(): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      await this.authRepository.logout();

      runInAction(() => {
        this.isLoading = false;
        this.isVerified = false;
        this.isAuthenticated = false;
        this.user = null;
        this.isCodeSent = false;
        this.phoneNumber = '';
      });

      await this.secureStorage.clearAllAuthData();

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.setError(this.getErrorMessage(error));
      });
      return false;
    }
  }

  /**
   * Загрузка данных пользователя
   */
  async loadUser(): Promise<User | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const user = await this.authRepository.getCurrentUser();

      runInAction(() => {
        this.isLoading = false;
        this.user = user;
        if (user) {
          this.isAuthenticated = true;
          this.isVerified = true;
        }
      });

      return user;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.setError(this.getErrorMessage(error));
      });
      return null;
    }
  }

  /**
   * Обновление данных пользователя
   * @param data - частичные данные пользователя
   */
  async updateUser(data: Partial<User>): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      const updatedUser = await this.authRepository.updateUser(data);

      runInAction(() => {
        this.isLoading = false;
        this.user = updatedUser;
        this.setError(null);
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.setError(this.getErrorMessage(error));
      });
      return false;
    }
  }

  /**
   * Установка номера телефона (ввод в UI)
   * @param phone - номер телефона
   */
  setPhoneNumber(phone: string): void {
    runInAction(() => {
      this.phoneNumber = phone;
      if (this.error) {
        this.error = null;
      }
    });
  }

  /**
   * Сброс флага отправки кода
   */
  resetCodeSentStatus(): void {
    runInAction(() => {
      this.isCodeSent = false;
    });
  }

  /**
   * Полная очистка состояния
   */
  resetState(): void {
    runInAction(() => {
      this.phoneNumber = '';
      this.isLoading = false;
      this.error = null;
      this.isCodeSent = false;
      this.isVerified = false;
      this.isAuthenticated = false;
      this.user = null;
    });
  }

  /**
   * Проверка наличия номера телефона в SecureStorage
   */
  async loadSavedPhoneNumber(): Promise<string | null> {
    try {
      const phone = await this.secureStorage.loadPhoneNumber();
      if (phone) {
        runInAction(() => {
          this.phoneNumber = phone;
        });
      }
      return phone;
    } catch (error) {
      console.error('Error loading phone number:', error);
      return null;
    }
  }

  private setLoading(loading: boolean): void {
    runInAction(() => {
      this.isLoading = loading;
    });
  }

  private setError(error: string | null): void {
    runInAction(() => {
      this.error = error;
    });
  }

  /**
   * Безопасное извлечение сообщения из ошибки
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'auth.errors.UNKNOWN_ERROR';
  }

  /**
   * Полное имя пользователя или телефон, если имя не задано
   */
  get displayName(): string {
    if (this.user?.name) {
      return this.user.name;
    }
    if (this.user?.phoneNumber) {
      return this.user.phoneNumber;
    }
    if (this.phoneNumber) {
      return this.phoneNumber;
    }
    return 'Гость';
  }

  /**
   * Инициалы пользователя для аватара
   */
  get initials(): string {
    if (this.user?.name) {
      const parts = this.user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (this.phoneNumber) {
      return this.phoneNumber.slice(-2);
    }
    return '?';
  }

  /**
   * Проверка, есть ли у пользователя премиум-доступ
   */
  get isPremium(): boolean {
    return this.user?.isPremium || false;
  }

  /**
   * Проверка, можно ли делать запрос кода (не в процессе и есть номер)
   */
  get canRequestCode(): boolean {
    return !this.isLoading && this.phoneNumber.length >= 10;
  }

  /**
   * Проверка, можно ли верифицировать код (не в процессе и есть код)
   */
  canVerifyCode(code: string): boolean {
    return !this.isLoading && code.length >= 4;
  }
}
