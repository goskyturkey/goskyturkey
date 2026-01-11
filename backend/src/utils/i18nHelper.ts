import { Request } from 'express';
import { Document } from 'mongoose';
import { I18nArrayItem, I18nString } from '../types/models';

export const defaultLocale = 'tr';
// Allow dynamic locales
export type SupportedLocale = string;
export const supportedLocales = ['tr', 'en', 'de', 'ru', 'ar'] as const;

/**
 * Get localized value from i18n object
 */
export function getLocalizedValue(
    field: I18nString | Record<string, string> | string | undefined | null,
    locale: SupportedLocale = defaultLocale
): string {
    if (!field) return '';

    // If it's a plain string (backward compatibility)
    if (typeof field === 'string') return field;

    // If it's a Map (Mongoose)
    if (field instanceof Map) {
        return field.get(locale) || field.get(defaultLocale) || Array.from(field.values())[0] || '';
    }

    // If it's an object with locale keys
    if (typeof field === 'object') {
        const val = (field as any)[locale] || (field as any)[defaultLocale];
        if (val) return val;
        return Object.values(field)[0] || '';
    }

    return '';
}

/**
 * Get localized array from i18n array of objects
 */
export function getLocalizedArray(
    arr: (I18nArrayItem | string)[] | undefined | null,
    locale: SupportedLocale = defaultLocale
): string[] {
    if (!Array.isArray(arr)) return [];

    return arr
        .map((item) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') {
                return item[locale] || item[defaultLocale] || Object.values(item)[0] || '';
            }
            return '';
        })
        .filter(Boolean);
}

/**
 * Transform a document to localized version
 */
export function localizeDocument<T extends Document>(
    doc: T | null,
    locale: SupportedLocale,
    localizedFields: string[] = [],
    localizedArrayFields: string[] = []
): Record<string, unknown> | null {
    if (!doc) return null;

    const obj: Record<string, unknown> = doc.toObject ? doc.toObject() : { ...doc };

    localizedFields.forEach((field) => {
        if (obj[field]) {
            obj[field] = getLocalizedValue(obj[field] as I18nString, locale);
        }
    });

    localizedArrayFields.forEach((field) => {
        if (obj[field]) {
            obj[field] = getLocalizedArray(obj[field] as I18nArrayItem[], locale);
        }
    });

    return obj;
}

/**
 * Extract locale from request
 */
export function getLocaleFromRequest(req: Request): SupportedLocale {
    // Check query parameter first
    const queryLang = (req.query.lang || req.query.locale) as string | undefined;
    if (queryLang) {
        return queryLang;
    }

    // Check header
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
        const primary = acceptLang.split(',')[0].split('-')[0].toLowerCase();
        return primary;
    }

    return defaultLocale;
}
