const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

// @route   POST /api/coupons/validate
// @desc    Kupon doğrula
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { code, totalAmount, activityId } = req.body;

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Kupon bulunamadı'
            });
        }

        // Geçerlilik kontrolü
        const validation = coupon.isValid(totalAmount);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Aktivite kontrolü
        if (coupon.applicableActivities.length > 0 && activityId) {
            const isApplicable = coupon.applicableActivities.some(
                id => id.toString() === activityId
            );
            if (!isApplicable) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu kupon seçili aktivite için geçerli değil'
                });
            }
        }

        // İndirim hesapla
        const discountAmount = coupon.calculateDiscount(totalAmount);

        res.json({
            success: true,
            data: {
                code: coupon.code,
                discount: coupon.discount,
                discountType: coupon.discountType,
                discountAmount,
                newTotal: totalAmount - discountAmount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   POST /api/coupons/apply
// @desc    Kuponu uygula (kullanım sayısını artır)
// @access  Public
router.post('/apply', async (req, res) => {
    try {
        const { code } = req.body;

        const coupon = await Coupon.findOneAndUpdate(
            { code: code.toUpperCase(), isActive: true },
            { $inc: { usedCount: 1 } },
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Kupon bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Kupon uygulandı'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// ============ ADMIN ROUTES ============

// @route   GET /api/coupons
// @desc    Tüm kuponları listele
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   POST /api/coupons
// @desc    Yeni kupon oluştur
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/coupons/:id
// @desc    Kupon güncelle
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Kupon bulunamadı'
            });
        }

        res.json({
            success: true,
            data: coupon
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/coupons/:id
// @desc    Kupon sil
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Kupon bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Kupon silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

module.exports = router;
