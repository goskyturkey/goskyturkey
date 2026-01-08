import { Request, Response, Router } from 'express';
import { adminOnly, protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import FAQ from '../models/FAQ.js';
import { getLocaleFromRequest, getLocalizedValue } from '../utils/i18nHelper.js';

const router = Router();

// @route   GET /api/faq
// @desc    Get all active FAQs
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const locale = getLocaleFromRequest(req);
    const { category } = req.query;
    const query: Record<string, unknown> = { isActive: true };

    if (category) query.category = category;

    const faqs = await FAQ.find(query).sort({ category: 1, order: 1 });

    // Format by language - i18n Map format
    const formattedFaqs = faqs.map(faq => {
        const faqObj = faq.toObject();
        return {
            _id: faq._id,
            question: getLocalizedValue(faqObj.question, locale),
            answer: getLocalizedValue(faqObj.answer, locale),
            category: faq.category
        };
    });

    res.json({
        success: true,
        count: formattedFaqs.length,
        locale,
        data: formattedFaqs
    });
}));

// @route   GET /api/faq/admin
// @desc    Get all FAQs for admin
// @access  Private/Admin
router.get('/admin', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const faqs = await FAQ.find().sort({ category: 1, order: 1 });

    // Convert Map to Object for JSON
    const formattedFaqs = faqs.map(faq => {
        const obj = faq.toObject();
        return {
            ...obj,
            question: obj.question instanceof Map ? Object.fromEntries(obj.question) : obj.question,
            answer: obj.answer instanceof Map ? Object.fromEntries(obj.answer) : obj.answer
        };
    });

    res.json({
        success: true,
        count: formattedFaqs.length,
        data: formattedFaqs
    });
}));

// @route   POST /api/faq
// @desc    Create new FAQ
// @access  Private/Admin
router.post('/', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { question, answer, category } = req.body;

    // Find max order for category
    const maxOrder = await FAQ.findOne({ category: category || 'general' })
        .sort({ order: -1 })
        .select('order');

    const faq = await FAQ.create({
        question,
        answer,
        category: category || 'general',
        order: maxOrder ? maxOrder.order + 1 : 0
    });

    res.status(201).json({
        success: true,
        data: faq
    });
}));

// @route   PUT /api/faq/:id
// @desc    Update FAQ
// @access  Private/Admin
router.put('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { question, answer, category, order, isActive } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
        req.params.id,
        { question, answer, category, order, isActive },
        { new: true, runValidators: true }
    );

    if (!faq) {
        res.status(404).json({
            success: false,
            message: 'SSS bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: faq
    });
}));

// @route   DELETE /api/faq/:id
// @desc    Delete FAQ
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
        res.status(404).json({
            success: false,
            message: 'SSS bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        message: 'SSS silindi'
    });
}));

export default router;
