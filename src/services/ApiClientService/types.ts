// Определяем интерфейсы для типизации запросов
export interface VerificationCodeRequest {
  phoneNumber: string;
  fcmToken: string;
}

// Интерфейсы для ответов
export interface AuthResponseDataRequestVerificationCode {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    expiresIn: number;
  };
}

// Параметры запрос кода подтверждения
export type VerifyCoderParams = {
  phone: string;
  code: string;
  setIsVerified: (value: boolean) => Promise<void>;
};

export type RequestCodeParams = {
  phone: string;
};

// Интерфейсы для ответов
export interface AuthResponseDataVerifyCode {
  success: boolean;
  message: string;
  data: AuthTokens;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
  isVerified: boolean;
  phoneNumber: string;
}
