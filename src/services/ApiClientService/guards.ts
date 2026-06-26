import { UpdateUserData } from './index';

export const isUpdateUserData = (value: any): value is UpdateUserData => {
  return (
    value && typeof value === 'object' && !(value instanceof FormData) && 'phoneNumber' in value
  );
};

export const isFormData = (value: any): value is FormData => {
  return value instanceof FormData;
};
