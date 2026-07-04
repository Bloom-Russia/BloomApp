export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  isVerified: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
}
