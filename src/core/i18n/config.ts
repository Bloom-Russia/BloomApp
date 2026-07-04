import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Импорты переводов
import en from './locales/en.json';
import ru from './locales/ru.json';

// ============================================
// 1. КОНФИГУРАЦИЯ
// ============================================

/**
 * Доступные языки в приложении
 */
export const availableLanguages = ['en', 'ru'] as const;

/**
 * Язык по умолчанию
 */
export const defaultLanguage = 'ru';

/**
 * Ключ для сохранения языка в AsyncStorage
 */
export const LANGUAGE_STORAGE_KEY = 'app_language';

/**
 * Тип для доступных языков
 */
export type AvailableLanguage = (typeof availableLanguages)[number];

// ============================================
// 2. РЕСУРСЫ
// ============================================

const resources = {
  en: {
    translation: en,
  },
  ru: {
    translation: ru,
  },
};

// ============================================
// 3. ОПРЕДЕЛЕНИЕ ЯЗЫКА УСТРОЙСТВА
// ============================================

/**
 * Получить язык устройства
 */
const getDeviceLanguage = (): AvailableLanguage => {
  try {
    const locales = RNLocalize.getLocales();
    if (locales.length > 0) {
      const { languageTag } = locales[0];
      const language = languageTag.split('-')[0];
      if (availableLanguages.includes(language as AvailableLanguage)) {
        return language as AvailableLanguage;
      }
    }
    return defaultLanguage;
  } catch (error) {
    console.error('Error getting device language:', error);
    return defaultLanguage;
  }
};

// ============================================
// 4. ЗАГРУЗКА СОХРАНЕННОГО ЯЗЫКА
// ============================================

/**
 * Загрузить сохраненный язык из AsyncStorage
 */
const loadStoredLanguage = async (): Promise<AvailableLanguage | null> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && availableLanguages.includes(stored as AvailableLanguage)) {
      return stored as AvailableLanguage;
    }
    return null;
  } catch (error) {
    console.error('Error loading stored language:', error);
    return null;
  }
};

// ============================================
// 5. ИНИЦИАЛИЗАЦИЯ I18N
// ============================================

/**
 * Инициализация i18n
 * Сначала проверяет сохраненный язык, затем язык устройства
 */
export const initI18n = async (): Promise<void> => {
  try {
    // Пытаемся загрузить сохраненный язык
    let language = await loadStoredLanguage();

    // Если нет сохраненного, используем язык устройства
    if (!language) {
      language = getDeviceLanguage();
    }

    // ✅ Исправленная конфигурация для i18next v4+
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: defaultLanguage,
      // ❌ Удаляем compatibilityJSON: 'v3' - не поддерживается в v4+
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      // ✅ Для отладки в development
      debug: __DEV__,
    });

    console.log(`🌐 i18n initialized with language: ${language}`);
  } catch (error) {
    console.error('Error initializing i18n:', error);

    // Fallback инициализация с языком по умолчанию
    await i18n.use(initReactI18next).init({
      resources,
      lng: defaultLanguage,
      fallbackLng: defaultLanguage,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  }
};

// ============================================
// 6. УПРАВЛЕНИЕ ЯЗЫКОМ
// ============================================

/**
 * Сменить язык приложения
 * @param language - код языка ('en' | 'ru')
 */
export const changeLanguage = async (language: AvailableLanguage): Promise<boolean> => {
  try {
    if (!availableLanguages.includes(language)) {
      console.warn(`Language ${language} is not available`);
      return false;
    }

    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    console.log(`🌐 Language changed to: ${language}`);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

/**
 * Получить текущий язык
 */
export const getCurrentLanguage = (): AvailableLanguage => {
  return (i18n.language as AvailableLanguage) || defaultLanguage;
};

/**
 * Проверить, является ли язык доступным
 */
export const isLanguageAvailable = (language: string): language is AvailableLanguage => {
  return availableLanguages.includes(language as AvailableLanguage);
};

// ============================================
// 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить список доступных языков с их названиями
 */
export const getAvailableLanguagesWithNames = () => {
  return [
    { code: 'ru', name: 'Русский', nativeName: 'Русский' },
    { code: 'en', name: 'English', nativeName: 'English' },
  ] as const;
};

/**
 * Получить название языка по коду
 */
export const getLanguageName = (code: AvailableLanguage): string => {
  const languages = getAvailableLanguagesWithNames();
  const found = languages.find((l) => l.code === code);
  return found?.name || code;
};

// ============================================
// 8. ЭКСПОРТ
// ============================================

/**
 * Экспортируем i18n для использования в компонентах
 */
export default i18n;
