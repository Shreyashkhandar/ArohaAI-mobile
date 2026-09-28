import { translations } from './translations';
export { I18nProvider, useI18n } from './I18nProvider';
export { translations };

let globalLang = 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    globalLang = lang;
  }
}

export function getCurrentLanguage() {
  return globalLang;
}

export function t(key, params = {}) {
  if (!key) return '';

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

  const selectedDict = translations[globalLang] || translations.en;
  let template = resolveKey(selectedDict, key) || resolveKey(translations.en, key) || key;

  if (params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      const val = params[paramKey];
      template = template.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val));
    });
  }

  return template;
}
