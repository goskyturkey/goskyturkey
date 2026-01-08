import { Request, Response, Router } from 'express';
import { adminOnly, protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Activity from '../models/Activity.js';
import { IActivity } from '../types/models.js';
import { getLocaleFromRequest, localizeDocument } from '../utils/i18nHelper.js';

const router = Router();

// Fields to localize
const LOCALIZED_FIELDS = ['name', 'description', 'shortDescription', 'location', 'meetingPoint', 'duration', 'importantNote'];
const LOCALIZED_ARRAY_FIELDS = ['includes', 'excludes'];

// Helper to localize activity
const localizeActivity = (activity: IActivity, locale: string) => {
    return localizeDocument(activity, locale, LOCALIZED_FIELDS, LOCALIZED_ARRAY_FIELDS);
};

// ============ PUBLIC ROUTES ============

// @route   GET /api/activities
// @desc    Get all active activities
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { category, featured } = req.query;
    const locale = getLocaleFromRequest(req);

    const query: Record<string, unknown> = { isActive: true };

    if (category) {
        query.category = category;
    }

    if (featured === 'true') {
        query.isFeatured = true;
    }

    const activities = await Activity.find(query)
        .select('-__v')
        .sort({ order: 1, createdAt: -1 });

    const localized = activities.map(a => localizeActivity(a, locale));

    res.json({
        success: true,
        count: activities.length,
        locale,
        data: localized
    });
}));

// @route   GET /api/activities/featured
// @desc    Get featured activities
// @access  Public
router.get('/featured', asyncHandler(async (req: Request, res: Response) => {
    const locale = getLocaleFromRequest(req);

    const activities = await Activity.find({ isActive: true, isFeatured: true })
        .select('-__v')
        .sort({ order: 1 })
        .limit(6);

    const localized = activities.map(a => localizeActivity(a, locale));

    res.json({
        success: true,
        locale,
        data: localized
    });
}));

// @route   GET /api/activities/:slug
// @desc    Get single activity by slug
// @access  Public
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
    const locale = getLocaleFromRequest(req);

    const activity = await Activity.findOne({
        slug: req.params.slug,
        isActive: true
    });

    if (!activity) {
        res.status(404).json({
            success: false,
            message: 'Aktivite bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        locale,
        data: localizeActivity(activity, locale)
    });
}));

// ============ ADMIN ROUTES ============

// @route   GET /api/activities/admin/all
// @desc    Get all activities (admin - raw data)
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const activities = await Activity.find()
        .sort({ order: 1, createdAt: -1 });

    res.json({
        success: true,
        count: activities.length,
        data: activities
    });
}));

// @route   POST /api/activities/admin
// @desc    Create new activity
// @access  Private/Admin
router.post('/admin', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const activity = await Activity.create(req.body);

    res.status(201).json({
        success: true,
        data: activity
    });
}));

// @route   PUT /api/activities/admin/:id
// @desc    Update activity
// @access  Private/Admin
router.put('/admin/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const activity = await Activity.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!activity) {
        res.status(404).json({
            success: false,
            message: 'Aktivite bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: activity
    });
}));

// @route   DELETE /api/activities/admin/:id
// @desc    Delete activity
// @access  Private/Admin
router.delete('/admin/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
        res.status(404).json({
            success: false,
            message: 'Aktivite bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        message: 'Aktivite silindi'
    });
}));

export default router;
