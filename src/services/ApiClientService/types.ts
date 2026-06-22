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

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Profession {
  id: string;
  name: string;
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

export interface CitiesAndProfessionResponse {
  cities: City[];
  professions: Profession[];
}

export interface OnboardingResponse {
  slides: OnboardingSlide[];
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

export interface UserResponse {
  user: {
    id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
  };
}
