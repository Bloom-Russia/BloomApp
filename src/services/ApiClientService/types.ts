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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
  isVerified: boolean;
  phoneNumber: string;
  hasPin: boolean;
}

export type VerifyCoderParams = {
  phone: string;
  code: string;
  setIsVerified: (value: boolean) => Promise<void>;
};

export type VerifyPinCoderParams = {
  pinCode: string;
};

export type SavePinParams = {
  pinCode: string;
};

// Интерфейсы для ответов
export interface AuthResponseDataResponseVerificationCode {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    expiresIn: number;
  };
}

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
    lastName?: string;
    patronymic?: string;
    birthday?: string;
    telegram?: string;
    experience?: string;
    max?: string;
    city?: string | null;
    professions?: string[];
    address?: string;
    avatar?: string;
    isVerified?: boolean;
    isUserDataComplete?: boolean;
    fullName?: string;
    avatarUrl?: string;
  };
  isUserDataComplete?: boolean;
  phoneIsChanged?: boolean;
}

export interface UpdateUserData {
  name?: string;
  lastName?: string;
  patronymic?: string;
  birthday?: string;
  telegram?: string;
  experience?: string;
  max?: string;
  city?: string;
  professions?: string[];
  email?: string;
  address?: string;
  phoneNumber?: string;
  avatar?: string; // может быть, но обычно не используется
}

export type UpdateUserRequest =
  | FormData
  | {
      userData: UpdateUserData;
      avatar?: string | null;
    };
