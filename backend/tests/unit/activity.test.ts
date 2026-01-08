import { beforeEach, describe, expect, it } from '@jest/globals';
import Activity from '../../src/models/Activity.js';

describe('Activity Model', () => {
    beforeEach(async () => {
        await Activity.deleteMany({});
    });

    it('should create an activity with i18n fields', async () => {
        const activityData = {
            name: { tr: 'Test Aktivite', en: 'Test Activity' },
            description: { tr: 'Açıklama', en: 'Description' },
            location: { tr: 'İstanbul', en: 'Istanbul' },
            category: 'paragliding',
            price: 1000
        };

        const activity = await Activity.create(activityData);

        expect(activity).toBeDefined();
        expect(activity.name.tr).toBe('Test Aktivite');
        expect(activity.name.en).toBe('Test Activity');
        expect(activity.slug).toBe('test-aktivite');
        expect(activity.price).toBe(1000);
    });

    it('should generate slug from Turkish name', async () => {
        const activity = await Activity.create({
            name: { tr: 'Yamaç Paraşütü Deneyimi', en: 'Paragliding' },
            description: { tr: 'Test', en: 'Test' },
            location: { tr: 'Fethiye', en: 'Fethiye' },
            category: 'paragliding',
            price: 2000
        });

        expect(activity.slug).toBe('yamac-parasutu-deneyimi');
    });

    it('should require Turkish name', async () => {
        await expect(
            Activity.create({
                name: { en: 'Only English' },
                description: { tr: 'Test', en: 'Test' },
                location: { tr: 'Test', en: 'Test' },
                category: 'paragliding',
                price: 1000
            })
        ).rejects.toThrow();
    });

    it('should require category', async () => {
        await expect(
            Activity.create({
                name: { tr: 'Test', en: 'Test' },
                description: { tr: 'Test', en: 'Test' },
                location: { tr: 'Test', en: 'Test' },
                price: 1000
            })
        ).rejects.toThrow();
    });

    it('should validate category enum', async () => {
        await expect(
            Activity.create({
                name: { tr: 'Test', en: 'Test' },
                description: { tr: 'Test', en: 'Test' },
                location: { tr: 'Test', en: 'Test' },
                category: 'invalid',
                price: 1000
            })
        ).rejects.toThrow();
    });

    it('should handle includes/excludes arrays', async () => {
        const activity = await Activity.create({
            name: { tr: 'Test', en: 'Test' },
            description: { tr: 'Test', en: 'Test' },
            location: { tr: 'Test', en: 'Test' },
            category: 'balloon',
            price: 5000,
            includes: [
                { tr: 'Pilot', en: 'Pilot' },
                { tr: 'Sigorta', en: 'Insurance' }
            ],
            excludes: [
                { tr: 'Ulaşım', en: 'Transportation' }
            ]
        });

        expect(activity.includes).toHaveLength(2);
        expect(activity.includes[0].tr).toBe('Pilot');
        expect(activity.excludes).toHaveLength(1);
    });
});
