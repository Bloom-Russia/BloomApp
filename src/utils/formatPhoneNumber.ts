export const formatPhoneNumber = (phone: string | undefined) => {
  if (!phone) {
    return '';
  }
  let number = phone.replace(/\D/g, '');
  if (number.startsWith('8')) {
    number = `7${number.slice(1)}`;
  }

  // Проверяем длину (должно быть 11 цифр для России)
  if (number.length !== 11) {
    return phone; // возвращаем исходный, если формат неверный
  }

  // Форматируем: +7 (909) 784-73-70
  const countryCode = number.slice(0, 1);
  const areaCode = number.slice(1, 4);
  const firstPart = number.slice(4, 7);
  const secondPart = number.slice(7, 9);
  const thirdPart = number.slice(9, 11);

  return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}-${thirdPart}`;
};
