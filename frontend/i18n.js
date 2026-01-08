import { getRequestConfig } from 'next-intl/server';

const locales = ['tr', 'en', 'de', 'fr', 'hi', 'zh'];

export default getRequestConfig(async ({ requestLocale }) => {
    // requestLocale from next-intl v4
    let locale = await requestLocale;

    // Fallback to default locale if not valid
    if (!locale || !locales.includes(locale)) {
        locale = 'tr';
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
