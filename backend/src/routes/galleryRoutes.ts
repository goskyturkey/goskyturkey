import { Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { adminOnly, protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import GalleryItem from '../models/Gallery';
import { getLocaleFromRequest, localizeDocument } from '../utils/i18nHelper';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        // Use uploads directory relative to cwd - PM2 runs from /app/backend
        const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
});

// Localized fields
const LOCALIZED_FIELDS = ['title', 'description'];

// @route   GET /api/gallery
// @desc    Get all gallery items
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const locale = getLocaleFromRequest(req);
    const { category, featured, limit = '50' } = req.query;
    const query: Record<string, unknown> = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const items = await GalleryItem.find(query)
        .sort({ order: 1, createdAt: -1 })
        .limit(parseInt(limit as string))
        .populate('activity', 'name slug');

    const localized = items.map(item => localizeDocument(item, locale, LOCALIZED_FIELDS, []));

    res.json({
        success: true,
        count: items.length,
        locale,
        data: localized
    });
}));

// @route   GET /api/gallery/admin
// @desc    Get all gallery items for admin
// @access  Private/Admin
router.get('/admin', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const items = await GalleryItem.find()
        .sort({ category: 1, order: 1 })
        .populate('activity', 'name slug');

    res.json({
        success: true,
        count: items.length,
        data: items
    });
}));

// @route   POST /api/gallery
// @desc    Add new gallery item
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, activity, isFeatured, tags } = req.body;

    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'Resim zorunludur'
        });
        return;
    }

    const imageUrl = `/uploads/gallery/${req.file.filename}`;

    // Find max order
    const maxOrder = await GalleryItem.findOne({ category: category || 'general' })
        .sort({ order: -1 })
        .select('order');

    const item = await GalleryItem.create({
        title: typeof title === 'string' ? { tr: title, en: '' } : title,
        description: typeof description === 'string' ? { tr: description, en: '' } : description,
        imageUrl,
        category: category || 'general',
        activity: activity || null,
        isFeatured: isFeatured === 'true',
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        order: maxOrder ? maxOrder.order + 1 : 0,
        metadata: {
            size: req.file.size,
            mimeType: req.file.mimetype
        }
    });

    res.status(201).json({
        success: true,
        data: item
    });
}));

// @route   PUT /api/gallery/:id
// @desc    Update gallery item
// @access  Private/Admin
router.put('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, activity, isFeatured, isActive, order, tags } = req.body;

    const item = await GalleryItem.findByIdAndUpdate(
        req.params.id,
        {
            title,
            description,
            category,
            activity: activity || null,
            isFeatured,
            isActive,
            order,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : []
        },
        { new: true, runValidators: true }
    );

    if (!item) {
        res.status(404).json({
            success: false,
            message: 'Öğe bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: item
    });
}));

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery item
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
        res.status(404).json({
            success: false,
            message: 'Öğe bulunamadı'
        });
        return;
    }

    // Delete file - imageUrl is like /uploads/gallery/...
    const filePath = path.join(process.cwd(), item.imageUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    await item.deleteOne();

    res.json({
        success: true,
        message: 'Öğe silindi'
    });
}));

export default router;
