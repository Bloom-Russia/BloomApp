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

export default i18n;
