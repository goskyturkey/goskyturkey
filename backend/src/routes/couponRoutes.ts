import { Request, Response, Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Coupon from '../models/Coupon';

const router = Router();

// @route   POST /api/coupons/validate
// @desc    Validate coupon
// @access  Public
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
    const { code, totalAmount, activityId } = req.body;

    if (!code || typeof code !== 'string') {
        res.status(400).json({
            success: false,
            message: 'Kupon kodu zorunludur'
        });
        return;
    }

    const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true
    });

    if (!coupon) {
        res.status(404).json({
            success: false,
            message: 'Kupon bulunamadı'
        });
        return;
    }

    // Validity check
    const validation = coupon.isValid(totalAmount);
    if (!validation.valid) {
        res.status(400).json({
            success: false,
            message: validation.message
        });
        return;
    }

    // Activity check
    if (coupon.applicableActivities && coupon.applicableActivities.length > 0 && activityId) {
        const isApplicable = coupon.applicableActivities.some(
            (id) => id.toString() === activityId
        );
        if (!isApplicable) {
            res.status(400).json({
                success: false,
                message: 'Bu kupon seçili aktivite için geçerli değil'
            });
            return;
        }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(totalAmount || 0);

    res.json({
        success: true,
        data: {
            code: coupon.code,
            discountValue: coupon.discountValue,
            discountType: coupon.discountType,
            discountAmount,
            newTotal: (totalAmount || 0) - discountAmount
        }
    });
}));

// @route   POST /api/coupons/apply
// @desc    Apply coupon (increment usage)
// @access  Public
router.post('/apply', asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    const coupon = await Coupon.findOneAndUpdate(
        { code: code.toUpperCase(), isActive: true },
        { $inc: { usedCount: 1 } },
        { new: true }
    );

    if (!coupon) {
        res.status(404).json({
            success: false,
            message: 'Kupon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        message: 'Kupon uygulandı'
    });
}));

// ============ ADMIN ROUTES ============

// @route   GET /api/coupons
// @desc    List all coupons
// @access  Private/Admin
router.get('/', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
        success: true,
        data: coupons
    });
}));

// @route   POST /api/coupons
// @desc    Create coupon
// @access  Private/Admin
router.post('/', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
        success: true,
        data: coupon
    });
}));

// @route   PUT /api/coupons/:id
// @desc    Update coupon
// @access  Private/Admin
router.put('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!coupon) {
        res.status(404).json({
            success: false,
            message: 'Kupon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: coupon
    });
}));

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
        res.status(404).json({
            success: false,
            message: 'Kupon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        message: 'Kupon silindi'
    });
}));

export default router;
