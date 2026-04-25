import en from '../locales/en.json';
import hi from '../locales/hi.json';

const locales = { en, hi };

export const t = (key, lang = 'en') => {
  return locales[lang]?.[key] || locales['en']?.[key] || key;
};
