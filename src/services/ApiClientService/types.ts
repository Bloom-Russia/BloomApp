// Интерфейсы для ответов

export interface AuthResponseDataRequestVerificationCode {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    expiresIn: number;
  };
}

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  fullImageUrl: string;
  order: number;
}

// Параметры запрос подтверждения кода
export type VerifyCoderParams = {
  phone: string;
  code: string;
  setIsVerified: (value: boolean) => Promise<void>;
  errorCodeCallBack: () => void;
};

// Параметры запрос подтверждения pin кода
export type VerifyPinCoderParams = {
  phoneNumber: string;
  pinCode: string;
};

// Параметры для сохраненния PIN
export type SavePinParams = {
  phoneNumber: string;
  pinCode: string;
};

// Параметры для проверки есть ли PIN
export type CheckPinParams = {
  phoneNumber: string;
};

// Тип для запроса на выход
export interface LogoutRequest {
  phoneNumber: string;
}

// Тип для ответа на выход
export interface LogoutResponse {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
  };
}

export type SavePinResponse = {
  success: boolean;
  message: string;
  data: {
    phoneNumber: string;
    hasPin: boolean;
  };
};

export interface OnboardingResponse {
  slides: OnboardingSlide[];
  completed: boolean;
}

export type RequestCodeParams = {
  phone: string;
};

// Интерфейсы для ответов
export interface AuthResponseDataVerifyCode {
  success: boolean;
  message: string;
  data: AuthTokens;
}

export interface AuthResponseDataVerifyPinCode {
  success: boolean;
  message: string;
  data: {
    phoneNumber: string;
    userId: string;
    isVerified: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
  isVerified: boolean;
  phoneNumber: string;
  hasPin: boolean;
}

export interface CheckPinStatusResponse {
  hasPin: boolean;
  isVerified: boolean;
}
