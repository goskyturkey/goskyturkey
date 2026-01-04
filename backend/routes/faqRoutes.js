const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/faq
// @desc    Tüm aktif SSS'leri getir (public)
router.get('/', async (req, res) => {
    try {
        const { category, lang = 'tr' } = req.query;
        const query = { isActive: true };

        if (category) query.category = category;

        const faqs = await FAQ.find(query).sort({ category: 1, order: 1 });

        // Dile göre formatla
        const formattedFaqs = faqs.map(faq => ({
            _id: faq._id,
            question: lang === 'en' && faq.question_en ? faq.question_en : faq.question,
            answer: lang === 'en' && faq.answer_en ? faq.answer_en : faq.answer,
            category: faq.category
        }));

        res.json({ success: true, count: formattedFaqs.length, data: formattedFaqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/faq/admin
// @desc    Admin için tüm SSS'ler
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ category: 1, order: 1 });
        res.json({ success: true, count: faqs.length, data: faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/faq
// @desc    Yeni SSS ekle
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { question, question_en, answer, answer_en, category } = req.body;

        // Sıralama için en yüksek order'ı bul
        const maxOrder = await FAQ.findOne({ category: category || 'general' })
            .sort({ order: -1 })
            .select('order');

        const faq = await FAQ.create({
            question,
            question_en,
            answer,
            answer_en,
            category: category || 'general',
            order: maxOrder ? maxOrder.order + 1 : 0
        });

        res.status(201).json({ success: true, data: faq });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/faq/:id
// @desc    SSS güncelle
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { question, question_en, answer, answer_en, category, order, isActive } = req.body;

        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            { question, question_en, answer, answer_en, category, order, isActive },
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({ success: false, message: 'SSS bulunamadı' });
        }

        res.json({ success: true, data: faq });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/faq/:id
// @desc    SSS sil
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'SSS bulunamadı' });
        }

        res.json({ success: true, message: 'SSS silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
