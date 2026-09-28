import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

const LANGUAGE_STORAGE_KEY = '@arohaai_language';

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isInitialized: false,
});

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSavedLanguage() {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isMounted && savedLang && translations[savedLang]) {
          setLanguageState(savedLang);
        }
      } catch (err) {
        console.warn('[I18nProvider] Failed to load saved language:', err?.message);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }
    loadSavedLanguage();
    return () => {
      isMounted = false;
    };
  }, []);

  const changeLanguage = useCallback(async (newLang) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } catch (err) {
        console.warn('[I18nProvider] Failed to persist language:', err?.message);
      }
    }
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      if (!key) return '';

      // 1. Traverse dictionary with dot-notation
      const resolveKey = (dict, path) => {
        const parts = path.split('.');
        let current = dict;
        for (const p of parts) {
          if (current && typeof current === 'object' && p in current) {
            current = current[p];
          } else {
            return null;
          }
        }
        return typeof current === 'string' ? current : null;
      };

      const selectedDict = translations[language];
      const englishDict = translations.en;

      let template = resolveKey(selectedDict, key) || resolveKey(englishDict, key) || key;

      // 2. Perform parameter interpolation (e.g. {{name}})
      if (params && typeof params === 'object') {
        Object.keys(params).forEach((paramKey) => {
          const val = params[paramKey];
          template = template.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val));
        });
      }

      return template;
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        isInitialized,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
