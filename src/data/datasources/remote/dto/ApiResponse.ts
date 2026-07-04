import type { User } from '@domain/entities/User';

export interface ApiResponse<T = unknown> {
  data: T;
  status?: number;
  message?: string;
  success: boolean;
  meta?: Record<string, unknown>;
  errors?: any;
}

// Ответ с токенами
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

// Ответ с пользователем
export interface UserResponse {
  user: User;
}
