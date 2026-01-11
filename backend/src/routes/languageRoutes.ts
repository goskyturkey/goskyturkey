import express from 'express';
import { adminOnly as admin, protect } from '../middleware/auth';
import Language from '../models/Language';

const router = express.Router();

// @desc    Get all active languages
// @route   GET /api/languages
// @access  Public
router.get('/', async (_req, res) => {
    try {
        const languages = await Language.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, count: languages.length, data: languages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// @desc    Get all languages (Admin)
// @route   GET /api/languages/all
// @access  Private/Admin
router.get('/all', protect, admin, async (_req, res) => {
    try {
        const languages = await Language.find({}).sort({ order: 1 });
        res.json({ success: true, count: languages.length, data: languages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// @desc    Create language
// @route   POST /api/languages
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { code, name, flag, isActive, isDefault, order } = req.body;

        const languageExists = await Language.findOne({ code });
        if (languageExists) {
            res.status(400).json({ success: false, message: 'Language code already exists' });
            return;
        }

        const language = await Language.create({
            code,
            name,
            flag,
            isActive,
            isDefault,
            order
        });

        res.status(201).json({ success: true, data: language });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data', error });
    }
});

// @desc    Update language
// @route   PUT /api/languages/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const language = await Language.findById(req.params.id);

        if (language) {
            language.code = req.body.code || language.code;
            language.name = req.body.name || language.name;
            language.flag = req.body.flag || language.flag;
            language.isActive = req.body.isActive !== undefined ? req.body.isActive : language.isActive;
            language.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : language.isDefault;
            language.order = req.body.order !== undefined ? req.body.order : language.order;

            const updatedLanguage = await language.save();
            res.json({ success: true, data: updatedLanguage });
        } else {
            res.status(404).json({ success: false, message: 'Language not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'Update failed', error });
    }
});

// @desc    Delete language
// @route   DELETE /api/languages/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const language = await Language.findById(req.params.id);

        if (language) {
            await language.deleteOne();
            res.json({ success: true, message: 'Language removed' });
        } else {
            res.status(404).json({ success: false, message: 'Language not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'Delete failed', error });
    }
});

export default router;
