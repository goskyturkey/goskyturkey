const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// @route   GET /api/reviews/activity/:activityId
// @desc    Aktivite yorumlarını getir
// @access  Public
router.get('/activity/:activityId', async (req, res) => {
    try {
        const reviews = await Review.find({
            activity: req.params.activityId,
            isApproved: true
        })
            .sort({ createdAt: -1 })
            .limit(20);

        // Ortalama puan hesapla
        const stats = await Review.aggregate([
            { $match: { activity: require('mongoose').Types.ObjectId(req.params.activityId), isApproved: true } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                stats: stats[0] || { avgRating: 0, totalReviews: 0 }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   POST /api/reviews
// @desc    Yeni yorum ekle
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { activity, booking, customerName, customerEmail, rating, title, comment } = req.body;

        // Booking kontrolü (doğrulanmış satın alma)
        let isVerifiedPurchase = false;
        if (booking) {
            const bookingDoc = await Booking.findOne({
                _id: booking,
                status: { $in: ['confirmed', 'completed'] }
            });
            if (bookingDoc) {
                isVerifiedPurchase = true;
            }
        }

        const review = await Review.create({
            activity,
            booking,
            customerName,
            customerEmail,
            rating,
            title,
            comment,
            isVerifiedPurchase,
            isApproved: false // Manuel onay gerekli
        });

        res.status(201).json({
            success: true,
            message: 'Yorumunuz gönderildi, onay sonrası yayınlanacak',
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ============ ADMIN ROUTES ============

// @route   GET /api/reviews
// @desc    Tüm yorumları listele
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
    try {
        const { approved } = req.query;
        let query = {};
        if (approved !== undefined) {
            query.isApproved = approved === 'true';
        }

        const reviews = await Review.find(query)
            .populate('activity', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   PUT /api/reviews/:id/approve
// @desc    Yorumu onayla
// @access  Private/Admin
router.put('/:id/approve', protect, async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Yorum bulunamadı'
            });
        }

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Yorum sil
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Yorum bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Yorum silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

module.exports = router;
