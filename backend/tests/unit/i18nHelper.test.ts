import { describe, expect, it } from '@jest/globals';
import {
    defaultLocale,
    getLocalizedArray,
    getLocalizedValue,
    supportedLocales
} from '../../src/utils/i18nHelper.js';

describe('i18n Helper', () => {
    describe('getLocalizedValue', () => {
        it('should return Turkish value by default', () => {
            const field = { tr: 'Merhaba', en: 'Hello' };
            expect(getLocalizedValue(field)).toBe('Merhaba');
        });

        it('should return English value when requested', () => {
            const field = { tr: 'Merhaba', en: 'Hello' };
            expect(getLocalizedValue(field, 'en')).toBe('Hello');
        });

        it('should fallback to Turkish if English is empty', () => {
            const field = { tr: 'Merhaba', en: '' };
            expect(getLocalizedValue(field, 'en')).toBe('Merhaba');
        });

        it('should handle plain strings', () => {
            const field = 'Plain string';
            expect(getLocalizedValue(field, 'tr')).toBe('Plain string');
        });

        it('should return empty string for undefined', () => {
            expect(getLocalizedValue(undefined)).toBe('');
            expect(getLocalizedValue(null)).toBe('');
        });
    });

    describe('getLocalizedArray', () => {
        it('should localize array of i18n objects', () => {
            const arr = [
                { tr: 'Bir', en: 'One' },
                { tr: 'İki', en: 'Two' }
            ];

            expect(getLocalizedArray(arr, 'tr')).toEqual(['Bir', 'İki']);
            expect(getLocalizedArray(arr, 'en')).toEqual(['One', 'Two']);
        });

        it('should handle mixed arrays', () => {
            const arr = [
                { tr: 'Bir', en: 'One' },
                'Plain string'
            ];

            expect(getLocalizedArray(arr, 'tr')).toEqual(['Bir', 'Plain string']);
        });

        it('should return empty array for non-arrays', () => {
            expect(getLocalizedArray(undefined)).toEqual([]);
            expect(getLocalizedArray(null)).toEqual([]);
        });
    });

    describe('constants', () => {
        it('should have correct default locale', () => {
            expect(defaultLocale).toBe('tr');
        });

        it('should have supported locales', () => {
            expect(supportedLocales).toContain('tr');
            expect(supportedLocales).toContain('en');
        });
    });
});
