export interface AuthContextType {
  isVerified: boolean;
  setIsVerified: (value: boolean) => Promise<void>;
  isLoading: boolean;
}
