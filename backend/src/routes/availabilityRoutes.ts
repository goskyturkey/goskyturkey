import { Request, Response, Router } from 'express';
import { AnyBulkWriteOperation } from 'mongoose';
import { adminOnly, protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Availability from '../models/Availability.js';

const router = Router();

// Aktivite müsaitlik takvimi (2 aylık)
// DEFAULT: Tüm tarihler kapalı. Sadece admin açıkça açtıysa müsait.
// Ek olarak: 1 hafta içindeki tarihler her durumda kapalı (son dakika rezervasyonu yok)
router.get('/:activityId', asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;

    const monthNum = month ? Number(month) : new Date().getMonth() + 1;
    const yearNum = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);

    const availability = await Availability.find({
        activity: req.params.activityId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const calendar: Array<Record<string, unknown>> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1 hafta sonrasını hesapla
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = availability.find(a =>
            a.date.toISOString().split('T')[0] === dateStr
        );

        const isPast = d < today;
        const isWithinOneWeek = d < oneWeekLater; // 1 hafta içindeki tarihler

        // Admin bu tarihi açıkça açmış mı?
        const isExplicitlyOpen = existing && existing.isActive && !existing.isBlocked;
        const remaining = isExplicitlyOpen ? ((existing as any)?.remainingCapacity?.() || existing.maxCapacity - existing.bookedCount) : 0;

        // Müsait olma koşulları:
        // 1. Geçmiş değil
        // 2. 1 hafta içinde değil (veya admin isWithinOneWeek'i override etmiş olabilir - şimdilik hayır)
        // 3. Admin açıkça açmış
        // 4. Kontenjan var
        const isAvailable = !isPast && !isWithinOneWeek && isExplicitlyOpen && remaining > 0;

        calendar.push({
            date: dateStr,
            dayOfWeek: d.getDay(),
            isBlocked: isPast || isWithinOneWeek || !isExplicitlyOpen,
            isAvailable,
            remainingCapacity: remaining,
            priceModifier: (existing as any)?.priceModifier || 0,
            timeSlots: (existing as any)?.timeSlots || [],
            isWithinOneWeek // Frontend'e bilgi için
        });
    }

    res.json({
        success: true,
        data: calendar
    });
}));

// Belirli gün müsaitlik
router.get('/:activityId/:date', asyncHandler(async (req: Request, res: Response) => {
    const date = new Date(req.params.date);

    const availability = await Availability.findOne({
        activity: req.params.activityId,
        date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
        }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = new Date(req.params.date) < today;

    res.json({
        success: true,
        data: {
            date: req.params.date,
            isBlocked: (availability as any)?.isBlocked || isPast,
            isAvailable: !isPast && (!(availability as any)?.isBlocked),
            maxCapacity: availability?.maxCapacity || 10,
            bookedCount: availability?.bookedCount || 0,
            remainingCapacity: (availability as any)?.remainingCapacity?.() || 10,
            timeSlots: (availability as any)?.timeSlots || [
                { time: '09:00', capacity: 5, booked: 0 },
                { time: '11:00', capacity: 5, booked: 0 },
                { time: '14:00', capacity: 5, booked: 0 },
                { time: '16:00', capacity: 5, booked: 0 }
            ],
            priceModifier: (availability as any)?.priceModifier || 0
        }
    });
}));

// Müsaitlik güncelle/oluştur
router.put('/:activityId/:date', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { isBlocked, blockReason, maxCapacity, timeSlots, priceModifier } = req.body;
    const date = new Date(req.params.date);

    const availability = await Availability.findOneAndUpdate(
        {
            activity: req.params.activityId,
            date: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        },
        {
            activity: req.params.activityId,
            date: new Date(req.params.date),
            isBlocked,
            blockReason,
            maxCapacity,
            timeSlots,
            priceModifier
        },
        { upsert: true, new: true }
    );

    res.json({
        success: true,
        data: availability
    });
}));

// Toplu müsaitlik güncelle
router.post('/bulk', protect, adminOnly, asyncHandler(async (req: Request, res: Response) => {
    const { activityId, startDate, endDate, isBlocked, blockReason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const updates: AnyBulkWriteOperation[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        updates.push({
            updateOne: {
                filter: { activity: activityId, date: new Date(d) },
                update: {
                    activity: activityId,
                    date: new Date(d),
                    isBlocked,
                    blockReason
                },
                upsert: true
            }
        } as AnyBulkWriteOperation);
    }

    await Availability.bulkWrite(updates);

    res.json({
        success: true,
        message: `${updates.length} gün güncellendi`
    });
}));

export default router;
