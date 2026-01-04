const express = require('express');
const router = express.Router();
const GalleryItem = require('../models/Gallery');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer yapılandırması
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/gallery');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
});

// @route   GET /api/gallery
// @desc    Tüm galeri öğelerini getir (public)
router.get('/', async (req, res) => {
    try {
        const { category, featured, limit = 50 } = req.query;
        const query = { isActive: true };

        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;

        const items = await GalleryItem.find(query)
            .sort({ order: 1, createdAt: -1 })
            .limit(parseInt(limit))
            .populate('activity', 'name slug');

        res.json({ success: true, count: items.length, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/gallery/admin
// @desc    Admin için tüm galeri öğeleri
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const items = await GalleryItem.find()
            .sort({ category: 1, order: 1 })
            .populate('activity', 'name slug');

        res.json({ success: true, count: items.length, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/gallery
// @desc    Yeni galeri öğesi ekle
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, activity, isFeatured, tags } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Resim zorunludur' });
        }

        const imageUrl = `/uploads/gallery/${req.file.filename}`;

        // Sıralama için en yüksek order'ı bul
        const maxOrder = await GalleryItem.findOne({ category: category || 'general' })
            .sort({ order: -1 })
            .select('order');

        const item = await GalleryItem.create({
            title,
            description,
            imageUrl,
            category: category || 'general',
            activity: activity || null,
            isFeatured: isFeatured === 'true',
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            order: maxOrder ? maxOrder.order + 1 : 0,
            metadata: {
                size: req.file.size,
                mimeType: req.file.mimetype
            }
        });

        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/gallery/:id
// @desc    Galeri öğesini güncelle
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
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
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
            },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Öğe bulunamadı' });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/gallery/reorder
// @desc    Galeri sıralamasını güncelle
router.put('/reorder', protect, adminOnly, async (req, res) => {
    try {
        const { items } = req.body; // [{id, order}, ...]

        const operations = items.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order }
            }
        }));

        await GalleryItem.bulkWrite(operations);

        res.json({ success: true, message: 'Sıralama güncellendi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/gallery/:id
// @desc    Galeri öğesini sil
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const item = await GalleryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Öğe bulunamadı' });
        }

        // Dosyayı sil
        const filePath = path.join(__dirname, '..', item.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await item.deleteOne();

        res.json({ success: true, message: 'Öğe silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
