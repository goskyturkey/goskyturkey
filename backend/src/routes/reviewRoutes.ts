import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { adminOnly, protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Review from '../models/Review';
import { getQueryString } from '../utils/query';

const router = Router();

// @route   GET /api/reviews/activity/:activityId
// @desc    Get activity reviews
// @access  Public
router.get('/activity/:activityId', asyncHandler(async (req: Request, res: Response) => {
    const reviews = await Review.find({
        activity: req.params.activityId,
        isApproved: true
    })
        .sort({ createdAt: -1 })
        .limit(20);

    // Calculate average rating
    const stats = await Review.aggregate([
        { $match: { activity: new mongoose.Types.ObjectId(req.params.activityId as string), isApproved: true } },
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
}));

// @route   POST /api/reviews
// @desc    Add new review
// @access  Public
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { activity, booking, customerName, customerEmail, rating, title, comment } = req.body;

    const review = await Review.create({
        activity,
        booking,
        customerName,
        customerEmail,
        rating,
        title,
        comment,
        isApproved: false
    });

    res.status(201).json({
        success: true,
        message: 'Yorumunuz gönderildi, onay sonrası yayınlanacak',
        data: review
    });
}));

// ============ ADMIN ROUTES ============

// @route   GET /api/reviews
// @desc    List all reviews
// @access  Private/Admin
router.get('/', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const approved = getQueryString(req.query.approved);
    const query: Record<string, unknown> = {};

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
}));

// @route   PUT /api/reviews/:id/approve
// @desc    Approve review
// @access  Private/Admin
router.put('/:id/approve', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
    );

    if (!review) {
        res.status(404).json({
            success: false,
            message: 'Yorum bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: review
    });
}));

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
        res.status(404).json({
            success: false,
            message: 'Yorum bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        message: 'Yorum silindi'
    });
}));

export default router;
