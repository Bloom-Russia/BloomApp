import i18n, {
  availableLanguages,
  changeLanguage,
  defaultLanguage,
  getAvailableLanguagesWithNames,
  getCurrentLanguage,
  getLanguageName,
  initI18n,
  isLanguageAvailable,
  LANGUAGE_STORAGE_KEY,
} from './config';

// Экспортируем основные функции
export {
  initI18n,
  changeLanguage,
  getCurrentLanguage,
  isLanguageAvailable,
  getAvailableLanguagesWithNames,
  getLanguageName,
  availableLanguages,
  defaultLanguage,
  LANGUAGE_STORAGE_KEY,
};

export type { AvailableLanguage } from './config';

// Экспортируем i18n по умолчанию
export default i18n;
