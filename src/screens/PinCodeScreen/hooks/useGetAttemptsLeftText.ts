/**
 * Хук для получения текста с количеством оставшихся попыток
 */
export const useGetAttemptsLeftText = (attempts: number): string => {
  return `Неверный PIN-код. Осталось попыток: ${attempts}`;
};
