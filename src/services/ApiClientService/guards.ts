import { UpdateUserData } from '@services';

export const isFormData = (value: any): value is FormData => {
  return value instanceof FormData;
};

export const isUpdateUserData = (
  value: any,
): value is {
  userData: UpdateUserData;
  avatar?: string | null;
} => {
  return (
    value && typeof value === 'object' && 'userData' in value && typeof value.userData === 'object'
  );
};
