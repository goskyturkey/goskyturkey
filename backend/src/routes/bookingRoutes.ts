import express, { NextFunction, Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { adminOnly, protect } from '../middleware/auth.js';
import Activity from '../models/Activity.js';
import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';

const router: Router = express.Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// Validation rules for booking creation
const bookingValidation = [
    body('customerName').trim().notEmpty().withMessage('Ad soyad zorunludur'),
    body('customerEmail').isEmail().normalizeEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('customerPhone').trim().notEmpty().withMessage('Telefon numarası zorunludur'),
    body('date').isISO8601().withMessage('Geçerli bir tarih giriniz'),
    body('guests').optional().isInt({ min: 1, max: 50 }).withMessage('Misafir sayısı 1-50 arasında olmalı'),
];

// ============ PUBLIC ROUTES ============

// @route   POST /api/bookings
// @desc    Yeni rezervasyon oluştur
// @access  Public
router.post('/', bookingValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: errors.array().map(e => e.msg).join(', '),
            errors: errors.array()
        });
        return;
    }

    const {
        activity,
        activityId,
        date,
        time,
        guests,
        participants,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        paymentMethod,
        customerInfo
    } = req.body;

    const actId = activity || activityId;
    const guestCount = Number(guests || participants || 1);

    if (!actId || !date) {
        res.status(400).json({
            success: false,
            message: 'Aktivite ve tarih zorunludur'
        });
        return;
    }

    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
        res.status(400).json({
            success: false,
            message: 'Geçerli bir tarih giriniz'
        });
        return;
    }

    // Aktivite kontrolü
    const activityDoc = await Activity.findById(actId);
    if (!activityDoc || !activityDoc.isActive) {
        res.status(404).json({
            success: false,
            message: 'Aktivite bulunamadı'
        });
        return;
    }

    // Müsaitlik kontrolü
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    let availability = await Availability.findOne({
        activity: actId,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    const baseCapacity = availability?.maxCapacity || activityDoc.maxParticipants || 10;
    if (availability?.isBlocked) {
        res.status(400).json({
            success: false,
            message: availability.blockReason || 'Bu tarih için rezervasyon kapalı'
        });
        return;
    }

    if (time) {
        const slot = availability?.timeSlots?.find((s: { time: string; capacity?: number; booked?: number }) => s.time === time);
        const slotCapacity = slot?.capacity || baseCapacity;
        const slotBooked = slot?.booked || 0;
        if ((slotCapacity - slotBooked) < guestCount) {
            res.status(400).json({
                success: false,
                message: 'Seçtiğiniz saat diliminde yeterli kontenjan yok'
            });
            return;
        }
    } else {
        const totalRemaining = (availability?.maxCapacity || baseCapacity) - (availability?.bookedCount || 0);
        if (totalRemaining < guestCount) {
            res.status(400).json({
                success: false,
                message: 'Bu tarih için yeterli kontenjan yok'
            });
            return;
        }
    }

    // Toplam fiyat hesapla
    const unitPrice = activityDoc.discountPrice || activityDoc.price;
    if (!unitPrice || !Number.isFinite(unitPrice)) {
        res.status(400).json({
            success: false,
            message: 'Aktivite fiyatı tanımlı değil'
        });
        return;
    }

    const calculatedPrice = Math.max(0, unitPrice * guestCount);
    if (calculatedPrice <= 0) {
        res.status(400).json({
            success: false,
            message: 'Geçerli bir toplam fiyat hesaplanamadı'
        });
        return;
    }

    const sanitizedPaymentMethod = ['cash', 'card', 'transfer', 'iyzico'].includes(paymentMethod)
        ? paymentMethod
        : 'cash';

    const booking = await Booking.create({
        activity: actId,
        date: bookingDate,
        time,
        participants: guestCount,
        guests: guestCount,
        totalPrice: calculatedPrice,
        currency: activityDoc.currency || 'TRY',
        customerName: customerName || customerInfo?.name,
        customerEmail: customerEmail || customerInfo?.email,
        customerPhone: customerPhone || customerInfo?.phone,
        notes,
        paymentMethod: sanitizedPaymentMethod,
        status: 'pending',
        paymentStatus: 'pending'
    });

    // Müsaitlik güncelle
    if (!availability) {
        availability = new Availability({
            activity: actId,
            date: bookingDate,
            maxCapacity: baseCapacity,
            bookedCount: 0,
            timeSlots: []
        });
    }

    if (time) {
        let slot = availability.timeSlots?.find((s: { time: string }) => s.time === time);
        if (!slot) {
            slot = { time, capacity: baseCapacity, booked: 0 };
            availability.timeSlots = availability.timeSlots || [];
            availability.timeSlots.push(slot);
        }
        slot.booked = (slot.booked || 0) + guestCount;
    } else {
        availability.bookedCount = (availability.bookedCount || 0) + guestCount;
    }
    await availability.save();

    const populatedBooking = await Booking.findById(booking._id)
        .populate('activity', 'name thumbnailImage location duration');

    res.status(201).json({
        success: true,
        data: populatedBooking
    });
}));

// @route   GET /api/bookings/id/:id
// @desc    Rezervasyonu ID ile getir
// @access  Public
router.get('/id/:id', asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.id)
        .populate('activity', 'name thumbnailImage location duration');

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: booking
    });
}));

// @route   GET /api/bookings/:ref
// @desc    Rezervasyon durumu sorgula
// @access  Public
router.get('/:ref', asyncHandler(async (req: Request, res: Response) => {
    // Skip admin routes
    if (req.params.ref === 'admin') {
        res.status(404).json({ success: false, message: 'Not found' });
        return;
    }

    const booking = await Booking.findOne({ bookingRef: req.params.ref })
        .populate('activity', 'name thumbnailImage location duration');

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: {
            bookingRef: booking.bookingRef,
            activity: booking.activity,
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            currency: booking.currency,
            status: booking.status,
            paymentStatus: booking.paymentStatus
        }
    });
}));

// ============ ADMIN ROUTES ============

// @route   GET /api/bookings/admin
// @desc    Son rezervasyonları getir (Pagination/Limit destekli)
// @access  Private/Admin
router.get('/admin', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;

    // Admin dashboard genellikle son rezervasyonları ister
    const bookings = await Booking.find()
        .populate('activity', 'name category thumbnailImage')
        .sort({ createdAt: -1 })
        .limit(limit);

    res.json({
        success: true,
        count: bookings.length,
        data: bookings
    });
}));

// @route   GET /api/bookings/admin/all
// @desc    Tüm rezervasyonlar
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { status, paymentStatus, startDate, endDate } = req.query;

    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
        query.date = {};
        if (startDate) (query.date as Record<string, Date>).$gte = new Date(startDate as string);
        if (endDate) (query.date as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const bookings = await Booking.find(query)
        .populate('activity', 'name category thumbnailImage')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: bookings.length,
        data: bookings
    });
}));

// @route   GET /api/bookings/admin/stats
// @desc    Rezervasyon istatistikleri
// @access  Private/Admin
router.get('/admin/stats', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalBookings,
        todayBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        paidRevenueAgg,
        confirmedRevenueAgg,
        totalActivities
    ] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ date: { $gte: today } }),
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.countDocuments({ status: 'cancelled' }),
        Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Booking.aggregate([
            { $match: { status: 'confirmed', paymentStatus: { $ne: 'failed' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Activity.countDocuments()
    ]);

    res.json({
        success: true,
        data: {
            totalBookings,
            todayBookings,
            pendingBookings,
            confirmedBookings,
            cancelledBookings,
            paidRevenue: paidRevenueAgg[0]?.total || 0,
            totalRevenue: paidRevenueAgg[0]?.total || 0,
            confirmedRevenue: confirmedRevenueAgg[0]?.total || 0,
            totalActivities
        }
    });
}));

// @route   GET /api/bookings/admin/analytics
// @desc    Özet analytics verisi
// @access  Private/Admin
router.get('/admin/analytics', protect, adminOnly, asyncHandler(async (_req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);

    const [bookingsToday, bookingsWeek, bookingsMonth, revenueMonth, topActivities] = await Promise.all([
        Booking.countDocuments({ createdAt: { $gte: today } }),
        Booking.countDocuments({ createdAt: { $gte: weekAgo } }),
        Booking.countDocuments({ createdAt: { $gte: monthAgo } }),
        Booking.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: monthAgo } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Booking.aggregate([
            { $match: { createdAt: { $gte: monthAgo } } },
            { $group: { _id: '$activity', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
            { $sort: { bookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'activities',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'activity'
                }
            },
            { $unwind: '$activity' },
            {
                $project: {
                    _id: 0,
                    name: '$activity.name',
                    bookings: 1,
                    revenue: 1
                }
            }
        ])
    ]);

    res.json({
        success: true,
        data: {
            pageViews: { today: 0, week: 0, month: 0 },
            bookings: { today: bookingsToday, week: bookingsWeek, month: bookingsMonth },
            revenue: { today: 0, week: 0, month: revenueMonth[0]?.total || 0 },
            topActivities
        }
    });
}));

// @route   PUT /api/bookings/admin/:id
// @desc    Rezervasyon güncelle
// @access  Private/Admin
router.put('/admin/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { status, paymentStatus } = req.body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid') {
            updateData['paymentDetails.paidAt'] = new Date();
        }
    }

    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    ).populate('activity', 'name');

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: booking
    });
}));

// @route   DELETE /api/bookings/admin/:id
// @desc    Rezervasyon sil
// @access  Private/Admin
router.delete('/admin/:id', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    // Müsaitliği geri al
    const bookingDate = new Date(booking.date);
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const availability = await Availability.findOne({
        activity: booking.activity,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (availability) {
        const guestCount = booking.guests || booking.participants || 1;

        if (booking.time) {
            const slot = availability.timeSlots?.find((s: { time: string }) => s.time === booking.time);
            if (slot) {
                slot.booked = Math.max(0, (slot.booked || 0) - guestCount);
            }
        } else {
            availability.bookedCount = Math.max(0, (availability.bookedCount || 0) - guestCount);
        }
        await availability.save();
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: 'Rezervasyon silindi'
    });
}));

export default router;
