import { Request, Response, Router } from 'express';
import { adminOnly, protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Settings from '../models/Settings.js';
import { ISettings } from '../types/models.js';
import { getLocaleFromRequest, getLocalizedArray, getLocalizedValue } from '../utils/i18nHelper.js';

const router = Router();

// Helper to localize settings
const localizeSettings = (settings: ISettings, locale: string) => {
    const obj = settings.toObject();

    const stringFields = ['heroTitle', 'heroSubtitle', 'siteDescription', 'address',
        'aboutText', 'termsText', 'privacyText',
        'seoTitle', 'seoDescription', 'seoKeywords'];

    stringFields.forEach(field => {
        if (obj[field]) {
            obj[field] = getLocalizedValue(obj[field], locale);
        }
    });

    if (obj.whyUsItems) {
        obj.whyUsItems = getLocalizedArray(obj.whyUsItems, locale);
    }

    if (obj.trustBadges) {
        obj.trustBadges = obj.trustBadges.map((badge: Record<string, unknown>) => ({
            ...badge,
            text: getLocalizedValue(badge.text as Record<string, string>, locale)
        }));
    }

    if (obj.testimonials) {
        obj.testimonials = obj.testimonials.map((t: Record<string, unknown>) => ({
            ...t,
            location: getLocalizedValue(t.location as Record<string, string>, locale),
            text: getLocalizedValue(t.text as Record<string, string>, locale)
        }));
    }

    if (obj.stepperItems) {
        obj.stepperItems = obj.stepperItems.map((item: Record<string, unknown>) => ({
            ...item,
            title: getLocalizedValue(item.title as Record<string, string>, locale),
            description: getLocalizedValue(item.description as Record<string, string>, locale)
        }));
    }

    return obj;
};

// @route   GET /api/settings
// @desc    Get site settings
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const locale = getLocaleFromRequest(req);
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({
            siteName: 'GoSkyTurkey',
            heroTitle: {
                tr: 'Gökyüzüne Yeni Bir Bakış',
                en: 'A New Perspective from the Sky'
            },
            heroSubtitle: {
                tr: 'Yamaç paraşütü, gyrocopter ve balon turları',
                en: 'Paragliding, gyrocopter and balloon tours'
            }
        });
    }

    res.json({
        success: true,
        locale,
        data: localizeSettings(settings, locale)
    });
}));

// @route   GET /api/settings/raw
// @desc    Get raw settings (admin)
// @access  Private/Admin
router.get('/raw', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({ siteName: 'GoSkyTurkey' });
    }

    res.json({
        success: true,
        data: settings
    });
}));

// @route   PUT /api/settings/admin
// @desc    Update settings
// @access  Private/Admin
router.put('/admin', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create(req.body);
    } else {
        settings = await Settings.findByIdAndUpdate(
            settings._id,
            req.body,
            { new: true, runValidators: true }
        );
    }

    res.json({
        success: true,
        data: settings
    });
}));

export default router;
