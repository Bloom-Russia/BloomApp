import { useStores } from '@app/providers/StoreProvider';
import { useCallback } from 'react';

export const useAuth = () => {
  const { authStore } = useStores();

  const setVerified = useCallback(
    async (value: boolean) => {
      await authStore.setVerified(value);
    },
    [authStore]
  );

  return {
    isVerified: authStore.isVerified,
    isLoading: authStore.isLoading,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    error: authStore.error,
    phoneNumber: authStore.phoneNumber,
    isCodeSent: authStore.isCodeSent,
    setVerified,
    setPhoneNumber: authStore.setPhoneNumber,
    requestVerificationCode: authStore.requestVerificationCode,
    verifyCode: authStore.verifyCode,
    logout: authStore.logout,
    loadUser: authStore.loadUser,
    updateUser: authStore.updateUser,
    resetState: authStore.resetState,
    resetCodeSentStatus: authStore.resetCodeSentStatus,
  };
};
