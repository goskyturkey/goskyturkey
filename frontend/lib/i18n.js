// Dictionary loader
import en from './dictionaries/en.json';
import tr from './dictionaries/tr.json';

const dictionaries = {
    tr,
    en
};

export const locales = ['tr', 'en'];
export const defaultLocale = 'tr';

export function getDictionary(locale) {
    return dictionaries[locale] || dictionaries[defaultLocale];
}

export function getLocaleFromCookie() {
    if (typeof window === 'undefined') return defaultLocale;
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    return match ? match[1] : defaultLocale;
}

export function setLocaleCookie(locale) {
    if (typeof window === 'undefined') return;
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
}
