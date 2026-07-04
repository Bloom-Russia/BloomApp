import { ApiResponse, TokenResponse, UserResponse } from './ApiResponse';

// Запрос на отправку кода
export interface RequestCodeDTO {
  phone: string;
  fcmToken: string;
}

// Запрос на верификацию кода
export interface VerifyCodeDTO {
  phoneNumber: string;
  code: string;
}

// Ответ на верификацию
export interface VerifyCodeResponse extends ApiResponse<{
  token: string;
  user: UserResponse;
  refreshToken: string;
}> {}

// Запрос на обновление токена
export interface RefreshTokenDTO {
  refreshToken: string;
}

// Ответ на обновление токена
export interface RefreshTokenResponse extends ApiResponse<TokenResponse> {}
