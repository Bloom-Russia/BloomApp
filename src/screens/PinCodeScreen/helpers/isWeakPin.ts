import { WEAK_PINS, WEAK_PINS_BASE } from '../constants';

/**
 * Проверяет, является ли PIN-код слабым
 */
export const isWeakPin = (pin: string): boolean => {
  // Проверка по статическому списку
  if (WEAK_PINS.ALL.includes(pin)) {
    return true;
  }

  // Динамическая проверка по регулярным выражениям
  const { REGEX } = WEAK_PINS_BASE;
  return (
    REGEX.SAME_DIGITS.test(pin) || REGEX.SEQUENTIAL_ASC.test(pin) || REGEX.SEQUENTIAL_DESC.test(pin)
  );
};
