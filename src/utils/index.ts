// const CARD_LENGTH = 19;

// export const getCurrentDate = (date: string) => {
//   const t = new Date(date);
//   const day = ('0' + t.getDate()).slice(-2);
//   const month = ('0' + (t.getMonth() + 1)).slice(-2);
//   const year = t.getFullYear();
//   return `${day}.${month}.${year}`;
// };

// export const formatCardNumber = (value: string) => {
//   const regex = /^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/g;
//   const onlyNumbers = value.replace(/[^\d]/g, '');
//
//   return onlyNumbers.replace(regex, (regEx, $1, $2, $3, $4) =>
//     [$1, $2, $3, $4].filter(group => !!group).join(' '),
//   );
// };

// export const validateCreditCard = (value: string): boolean => {
//   if (/[^0-9-\s]+/.test(value) || value.length !== CARD_LENGTH) {
//     return false;
//   }
//   let nCheck = 0,
//     bEven = false;
//   value = value.replace(/\D/g, '');
//
//   for (let n = value.length - 1; n >= 0; n--) {
//     let cDigit = value.charAt(n),
//       nDigit = parseInt(cDigit, 10);
//
//     if (bEven && (nDigit *= 2) > 9) nDigit -= 9;
//
//     nCheck += nDigit;
//     bEven = !bEven;
//   }
//
//   return nCheck % 10 == 0;
// };

// export const formatPhoneNumber = (phone: string | undefined) => {
//   return phone
//     ? phone
//         .replace('+', '')
//         .replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '+$1 ($2) $3-$4-$5')
//     : '';
// };

// export const formatMoney = (value: number): string => {
//   const str = Math.abs(value).toString().padStart(3, '0');
//   const copies = str.slice(-2);
//   const rubles = str.slice(0, -2);
//   if (copies === '00' || copies === '0') {
//     return `${Number(rubles).toLocaleString(RU_RU)}`;
//   }
//   const formatted = `${Number(rubles).toLocaleString(RU_RU)}.${copies}`;
//   return value < 0 ? `-${formatted}` : formatted;
// };

// export const getFullDate = (value: string, today: string) => {
//   const inputDate = new Date(value);
//   const todayDate = new Date();
//   const isToday = todayDate.toDateString() === inputDate.toDateString();
//
//   if (isToday) {
//     return today;
//   }
//   return inputDate.toLocaleString(RU_RU, { month: 'long', day: 'numeric' });
// };

// const declensionOfHours = (num: number, hoursTranslate: string[]) => {
//   const cases = [2, 0, 1, 1, 1, 2];
//   return `${num} ${
//     hoursTranslate[
//       num % 100 > 4 && num % 100 < 20 ? 2 : cases[Math.min(num % 10, 5)]
//     ]
//   }`;
// };

// const declineMinutes = (minutes: number, minutesTranslate: string[]) => {
//   minutes = Math.abs(minutes) % 100; // Получаем абсолютное значение и берем по модулю 100
//   const lastDigit = minutes % 10;
//
//   if (minutes >= 11 && minutes <= 19) {
//     return `${minutes} ${minutesTranslate[0]}`;
//   }
//   if (lastDigit === 1) {
//     return `${minutes} ${minutesTranslate[1]}`;
//   }
//   if (lastDigit >= 2 && lastDigit <= 4) {
//     return `${minutes} ${minutesTranslate[2]}`;
//   }
//   return `${minutes} ${minutesTranslate[0]}`;
// };

// export const minutesToHourAndMinutes = (
//   totalMinutes: number,
//   minutesTranslate: string[],
//   hoursTranslate: string[],
// ) => {
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   if (hours === 0) {
//     return declineMinutes(minutes, minutesTranslate);
//   }
//   if (minutes === 0) {
//     return declensionOfHours(hours, hoursTranslate);
//   }
//   return `${declensionOfHours(hours, hoursTranslate)} ${declineMinutes(
//     minutes,
//     minutesTranslate,
//   )}`;
// };

//export const replacePhoneNumber = (phone: string) => phone.replace(/([!?\+() \-])/g, '');

export { vibrate } from './vibrate';
export { VIBRATION_DURATION } from './constans';

// Вспомогательная функция для задержки
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const normalizePhoneNumber = (phone: string): string => {
  // Удаляем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');

  // Если номер начинается с 8, меняем на 7
  if (cleaned.startsWith('8')) {
    return `+7${cleaned.slice(1)}`;
  }

  // Если номер начинается с 7, добавляем +
  if (cleaned.startsWith('7')) {
    return `+${cleaned}`;
  }

  // Если номер уже содержит +7 (без пробелов), возвращаем как есть
  if (phone.startsWith('+7')) {
    return `+7${cleaned}`;
  }

  return `+7${cleaned}`;
};
