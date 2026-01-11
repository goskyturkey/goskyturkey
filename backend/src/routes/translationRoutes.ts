import express, { Request, Response } from 'express';
import { adminOnly as admin, protect } from '../middleware/auth';
import Language from '../models/Language';
import Translation from '../models/Translation';

const router = express.Router();

// @desc    Get all translations for a specific language
// @route   GET /api/translations/:lang
// @access  Public
router.get('/:lang', async (req: Request, res: Response) => {
    try {
        const { lang } = req.params;
        const translations = await Translation.find({});

        // Convert to key-value format for frontend
        const result: Record<string, string> = {};
        translations.forEach(t => {
            const doc = t.toObject() as unknown as Record<string, unknown>;
            // Support both formats:
            // 1. Old format: { key, tr, en, de, ... } (direct fields)
            // 2. New format: { key, translations: Map { tr, en, de } }
            let value: string | undefined;

            if (t.translations && typeof t.translations.get === 'function') {
                // New Map format
                value = t.translations.get(lang) || t.translations.get('tr');
            } else if (doc[lang]) {
                // Old direct field format
                value = doc[lang] as string;
            } else if (doc['tr']) {
                // Fallback to TR
                value = doc['tr'] as string;
            }

            result[t.key] = value || t.key;
        });

        res.json({ success: true, data: result, lang });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// @desc    Get all translations (Admin - full data)
// @route   GET /api/translations
// @access  Private/Admin
router.get('/', protect, admin, async (_req: Request, res: Response) => {
    try {
        const translations = await Translation.find({}).sort({ category: 1, key: 1 });
        const languages = await Language.find({ isActive: true }).sort({ order: 1 });

        res.json({
            success: true,
            count: translations.length,
            data: translations,
            languages: languages.map(l => ({ code: l.code, name: l.name, flag: l.flag }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// @desc    Get translations by category
// @route   GET /api/translations/category/:category
// @access  Public
router.get('/category/:category', async (req: Request, res: Response) => {
    try {
        const translations = await Translation.find({ category: req.params.category });
        res.json({ success: true, data: translations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// @desc    Update a translation
// @route   PUT /api/translations/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req: Request, res: Response) => {
    try {
        const { translations, description } = req.body;

        const translation = await Translation.findById(req.params.id);
        if (!translation) {
            res.status(404).json({ success: false, message: 'Translation not found' });
            return;
        }

        // Update translations map
        if (translations && typeof translations === 'object') {
            Object.entries(translations).forEach(([lang, value]) => {
                translation.translations.set(lang, value as string);
            });
        }

        if (description !== undefined) {
            translation.description = description;
        }

        await translation.save();
        res.json({ success: true, data: translation });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Update failed', error });
    }
});

// @desc    Bulk update translations
// @route   PUT /api/translations/bulk/update
// @access  Private/Admin
router.put('/bulk/update', protect, admin, async (req: Request, res: Response) => {
    try {
        const { updates } = req.body; // Array of { id, translations }

        const bulkOps = updates.map((update: { id: string; translations: Record<string, string> }) => ({
            updateOne: {
                filter: { _id: update.id },
                update: {
                    $set: Object.fromEntries(
                        Object.entries(update.translations).map(([lang, val]) => [`translations.${lang}`, val])
                    )
                }
            }
        }));

        await Translation.bulkWrite(bulkOps);
        res.json({ success: true, message: `Updated ${updates.length} translations` });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Bulk update failed', error });
    }
});

// @desc    Create new translation (Admin)
// @route   POST /api/translations
// @access  Private/Admin
router.post('/', protect, admin, async (req: Request, res: Response) => {
    try {
        const { key, category, translations, description } = req.body;

        const existing = await Translation.findOne({ key });
        if (existing) {
            res.status(400).json({ success: false, message: 'Translation key already exists' });
            return;
        }

        const translation = await Translation.create({
            key,
            category,
            translations: new Map(Object.entries(translations || {})),
            description,
            isSystem: false
        });

        res.status(201).json({ success: true, data: translation });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Creation failed', error });
    }
});

// @desc    Delete translation (Admin - only non-system)
// @route   DELETE /api/translations/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req: Request, res: Response) => {
    try {
        const translation = await Translation.findById(req.params.id);

        if (!translation) {
            res.status(404).json({ success: false, message: 'Translation not found' });
            return;
        }

        if (translation.isSystem) {
            res.status(400).json({ success: false, message: 'Cannot delete system translation' });
            return;
        }

        await translation.deleteOne();
        res.json({ success: true, message: 'Translation deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Delete failed', error });
    }
});

// @desc    Seed default translations
// @route   POST /api/translations/seed
// @access  Private/Admin
router.post('/seed', protect, admin, async (_req: Request, res: Response) => {
    try {
        const defaultTranslations = [
            // Navigation
            { key: 'nav.home', category: 'navigation', translations: { tr: 'Ana Sayfa', en: 'Home' }, isSystem: true },
            { key: 'nav.experiences', category: 'navigation', translations: { tr: 'Deneyimler', en: 'Experiences' }, isSystem: true },
            { key: 'nav.gallery', category: 'navigation', translations: { tr: 'Galeri', en: 'Gallery' }, isSystem: true },
            { key: 'nav.faq', category: 'navigation', translations: { tr: 'SSS', en: 'FAQ' }, isSystem: true },
            { key: 'nav.about', category: 'navigation', translations: { tr: 'Hakkımızda', en: 'About Us' }, isSystem: true },
            { key: 'nav.contact', category: 'navigation', translations: { tr: 'İletişim', en: 'Contact' }, isSystem: true },
            { key: 'nav.reservation', category: 'navigation', translations: { tr: 'Rezervasyon', en: 'Book Now' }, isSystem: true },

            // Hero
            { key: 'hero.title', category: 'hero', translations: { tr: "Türkiye'nin En Güzel Manzaralarını Keşfedin", en: "Discover Turkey's Most Beautiful Landscapes" }, isSystem: true },
            { key: 'hero.subtitle', category: 'hero', translations: { tr: 'Yamaç paraşütü, gyrocopter ve balon turları ile gökyüzünden eşsiz deneyimler yaşayın.', en: 'Experience unique adventures from the sky with paragliding, gyrocopter and balloon tours.' }, isSystem: true },
            { key: 'hero.cta', category: 'hero', translations: { tr: 'Turları İncele →', en: 'Explore Tours →' }, isSystem: true },

            // Trust badges
            { key: 'trust.licensed', category: 'common', translations: { tr: 'TÜRSAB Lisanslı', en: 'TÜRSAB Licensed' }, isSystem: true },
            { key: 'trust.years', category: 'common', translations: { tr: 'Yıl Deneyim', en: 'Years Experience' }, isSystem: true },
            { key: 'trust.guests', category: 'common', translations: { tr: 'Mutlu Misafir', en: 'Happy Guests' }, isSystem: true },
            { key: 'trust.rating', category: 'common', translations: { tr: 'Ortalama Puan', en: 'Average Rating' }, isSystem: true },

            // Sections
            { key: 'sections.popularExperiences', category: 'common', translations: { tr: 'Popüler Deneyimler', en: 'Popular Experiences' }, isSystem: true },
            { key: 'sections.whyUs', category: 'common', translations: { tr: 'Neden GoSkyTurkey?', en: 'Why GoSkyTurkey?' }, isSystem: true },

            // Activity
            { key: 'activity.bookNow', category: 'activity', translations: { tr: 'Rezervasyon Yap', en: 'Book Now' }, isSystem: true },
            { key: 'activity.perPerson', category: 'activity', translations: { tr: '/ kişi', en: '/ person' }, isSystem: true },
            { key: 'activity.duration', category: 'activity', translations: { tr: 'Süre', en: 'Duration' }, isSystem: true },
            { key: 'activity.location', category: 'activity', translations: { tr: 'Konum', en: 'Location' }, isSystem: true },
            { key: 'activity.included', category: 'activity', translations: { tr: 'Dahil Olanlar', en: 'Included' }, isSystem: true },
            { key: 'activity.excluded', category: 'activity', translations: { tr: 'Dahil Olmayanlar', en: 'Not Included' }, isSystem: true },

            // Booking
            { key: 'booking.title', category: 'booking', translations: { tr: 'Rezervasyon', en: 'Booking' }, isSystem: true },
            { key: 'booking.personalInfo', category: 'booking', translations: { tr: 'Kişisel Bilgiler', en: 'Personal Information' }, isSystem: true },
            { key: 'booking.fullName', category: 'booking', translations: { tr: 'Ad Soyad', en: 'Full Name' }, isSystem: true },
            { key: 'booking.email', category: 'booking', translations: { tr: 'Email', en: 'Email' }, isSystem: true },
            { key: 'booking.phone', category: 'booking', translations: { tr: 'Telefon', en: 'Phone' }, isSystem: true },
            { key: 'booking.date', category: 'booking', translations: { tr: 'Tarih', en: 'Date' }, isSystem: true },
            { key: 'booking.notes', category: 'booking', translations: { tr: 'Notlar', en: 'Notes' }, isSystem: true },
            { key: 'booking.complete', category: 'booking', translations: { tr: 'Rezervasyonu Tamamla', en: 'Complete Reservation' }, isSystem: true },

            // Payment
            { key: 'payment.title', category: 'payment', translations: { tr: 'Ödeme', en: 'Payment' }, isSystem: true },
            { key: 'payment.loading', category: 'payment', translations: { tr: 'Ödeme hazırlanıyor...', en: 'Preparing payment...' }, isSystem: true },
            { key: 'payment.success', category: 'payment', translations: { tr: 'Ödeme Başarılı! 🎉', en: 'Payment Successful! 🎉' }, isSystem: true },
            { key: 'payment.failed', category: 'payment', translations: { tr: 'Ödeme Başarısız 😔', en: 'Payment Failed 😔' }, isSystem: true },

            // Common
            { key: 'common.loading', category: 'common', translations: { tr: 'Yükleniyor...', en: 'Loading...' }, isSystem: true },
            { key: 'common.error', category: 'common', translations: { tr: 'Hata', en: 'Error' }, isSystem: true },
            { key: 'common.save', category: 'common', translations: { tr: 'Kaydet', en: 'Save' }, isSystem: true },
            { key: 'common.cancel', category: 'common', translations: { tr: 'İptal', en: 'Cancel' }, isSystem: true },
            { key: 'common.backToHome', category: 'common', translations: { tr: 'Ana Sayfaya Dön', en: 'Back to Home' }, isSystem: true },

            // Footer
            { key: 'footer.rights', category: 'footer', translations: { tr: 'Tüm hakları saklıdır.', en: 'All rights reserved.' }, isSystem: true },

            // Gallery
            { key: 'gallery.title', category: 'gallery', translations: { tr: 'Galeri', en: 'Gallery' }, isSystem: true },
            { key: 'gallery.subtitle', category: 'gallery', translations: { tr: 'Unutulmaz anlardan kareler', en: 'Memorable moments captured' }, isSystem: true },

            // FAQ
            { key: 'faq.title', category: 'faq', translations: { tr: 'Sıkça Sorulan Sorular', en: 'Frequently Asked Questions' }, isSystem: true },
            { key: 'faq.categories.general', category: 'faq', translations: { tr: 'Genel', en: 'General' }, isSystem: true },
            { key: 'faq.categories.booking', category: 'faq', translations: { tr: 'Rezervasyon', en: 'Booking' }, isSystem: true },
            { key: 'faq.categories.payment', category: 'faq', translations: { tr: 'Ödeme', en: 'Payment' }, isSystem: true },
            { key: 'faq.categories.safety', category: 'faq', translations: { tr: 'Güvenlik', en: 'Safety' }, isSystem: true }
        ];

        let created = 0;
        let skipped = 0;

        for (const t of defaultTranslations) {
            const exists = await Translation.findOne({ key: t.key });
            if (!exists) {
                await Translation.create({
                    ...t,
                    translations: new Map(Object.entries(t.translations))
                });
                created++;
            } else {
                skipped++;
            }
        }

        res.json({
            success: true,
            message: `Seed complete: ${created} created, ${skipped} skipped (already exist)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Seed failed', error });
    }
});

export default router;
