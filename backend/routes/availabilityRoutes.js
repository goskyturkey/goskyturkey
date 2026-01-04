const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/availability/:activityId
// @desc    Aktivite müsaitlik takvimi
// @access  Public
router.get('/:activityId', async (req, res) => {
    try {
        const { month, year } = req.query;

        const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1, 1);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);

        const availability = await Availability.find({
            activity: req.params.activityId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // 2 aylık tarih listesi oluştur
        const calendar = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const existing = availability.find(a =>
                a.date.toISOString().split('T')[0] === dateStr
            );

            const isPast = d < today;

            calendar.push({
                date: dateStr,
                dayOfWeek: d.getDay(),
                isBlocked: existing?.isBlocked || isPast,
                isAvailable: !isPast && (!existing?.isBlocked && (existing?.remainingCapacity() || 10) > 0),
                remainingCapacity: existing?.remainingCapacity() || 10,
                priceModifier: existing?.priceModifier || 0,
                timeSlots: existing?.timeSlots || []
            });
        }

        res.json({
            success: true,
            data: calendar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   GET /api/availability/:activityId/:date
// @desc    Belirli gün müsaitlik
// @access  Public
router.get('/:activityId/:date', async (req, res) => {
    try {
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
                isBlocked: availability?.isBlocked || isPast,
                isAvailable: !isPast && (!availability?.isBlocked),
                maxCapacity: availability?.maxCapacity || 10,
                bookedCount: availability?.bookedCount || 0,
                remainingCapacity: availability?.remainingCapacity() || 10,
                timeSlots: availability?.timeSlots || [
                    { time: '09:00', capacity: 5, booked: 0 },
                    { time: '11:00', capacity: 5, booked: 0 },
                    { time: '14:00', capacity: 5, booked: 0 },
                    { time: '16:00', capacity: 5, booked: 0 }
                ],
                priceModifier: availability?.priceModifier || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// ============ ADMIN ROUTES ============

// @route   PUT /api/availability/:activityId/:date
// @desc    Müsaitlik güncelle/oluştur
// @access  Private/Admin
router.put('/:activityId/:date', protect, adminOnly, async (req, res) => {
    try {
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
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/availability/bulk
// @desc    Toplu müsaitlik güncelle
// @access  Private/Admin
router.post('/bulk', protect, adminOnly, async (req, res) => {
    try {
        const { activityId, startDate, endDate, isBlocked, blockReason } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];

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
            });
        }

        await Availability.bulkWrite(updates);

        res.json({
            success: true,
            message: `${updates.length} gün güncellendi`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
