// src/presentation/stores/AuthStore.ts
import { makeAutoObservable, runInAction } from 'mobx';

export class AuthStore {
  user: any = null;
  isVerified: boolean = false;
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  isCodeSent: boolean = false;
  phoneNumber: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  async requestVerificationCode(phone: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    this.phoneNumber = phone;

    try {
      // TODO: Заменить на реальный API запрос
      // const fcmToken = await this.authRepository.getFCMToken();
      // await this.authRepository.requestVerificationCode({ phoneNumber: phone, fcmToken });

      // Имитация запроса
      await new Promise((resolve) => setTimeout(resolve, 1500));

      runInAction(() => {
        this.isLoading = false;
        this.isCodeSent = true;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      });
      return false;
    }
  }

  async verifyCode(_code: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      // TODO: Заменить на реальный API запрос
      await new Promise((resolve) => setTimeout(resolve, 1500));

      runInAction(() => {
        this.isLoading = false;
        this.isVerified = true;
        this.isAuthenticated = true;
        this.user = { id: '1', phone: this.phoneNumber, name: 'User' };
        this.isCodeSent = false;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = error instanceof Error ? error.message : 'Неверный код';
      });
      return false;
    }
  }

  async logout(): Promise<void> {
    this.isLoading = true;

    try {
      // TODO: Заменить на реальный API запрос
      await new Promise((resolve) => setTimeout(resolve, 500));

      runInAction(() => {
        this.isLoading = false;
        this.isVerified = false;
        this.isAuthenticated = false;
        this.user = null;
        this.phoneNumber = '';
        this.isCodeSent = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = error instanceof Error ? error.message : 'Ошибка выхода';
      });
    }
  }

  setPhoneNumber(phone: string): void {
    this.phoneNumber = phone;
  }

  resetState(): void {
    this.phoneNumber = '';
    this.isLoading = false;
    this.error = null;
    this.isCodeSent = false;
    this.isVerified = false;
    this.isAuthenticated = false;
    this.user = null;
  }

  get displayName(): string {
    return this.user?.name || this.phoneNumber || 'Гость';
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}
