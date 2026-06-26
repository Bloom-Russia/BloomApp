export const normalizePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('8')) {
    return `+7${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('7')) {
    return `+${cleaned}`;
  }

  if (phone.startsWith('+7')) {
    return `+7${cleaned}`;
  }

  return `+7${cleaned}`;
};
