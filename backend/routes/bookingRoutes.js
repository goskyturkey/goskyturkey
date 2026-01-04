const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');
const Availability = require('../models/Availability');
const { protect, adminOnly } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

// @route   POST /api/bookings
// @desc    Yeni rezervasyon oluştur
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      activity, // activity ID
      activityId, // fallback
      date,
      time,
      guests,
      participants, // fallback
      customerName,
      customerEmail,
      customerPhone,
      notes,
      totalPrice,
      paymentMethod,
      customerInfo // fallback eski format
    } = req.body;

    const actId = activity || activityId;
    const guestCount = Number(guests || participants || 1);

    if (!actId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Aktivite ve tarih zorunludur'
      });
    }

    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir tarih giriniz'
      });
    }

    // Aktivite kontrolü
    const activityDoc = await Activity.findById(actId);
    if (!activityDoc || !activityDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
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
      return res.status(400).json({
        success: false,
        message: availability.blockReason || 'Bu tarih için rezervasyon kapalı'
      });
    }

    if (time) {
      const slot = availability?.timeSlots.find(s => s.time === time);
      const slotCapacity = slot?.capacity || baseCapacity;
      const slotBooked = slot?.booked || 0;
      if ((slotCapacity - slotBooked) < guestCount) {
        return res.status(400).json({
          success: false,
          message: 'Seçtiğiniz saat diliminde yeterli kontenjan yok'
        });
      }
    } else {
      const totalRemaining = (availability?.maxCapacity || baseCapacity) - (availability?.bookedCount || 0);
      if (totalRemaining < guestCount) {
        return res.status(400).json({
          success: false,
          message: 'Bu tarih için yeterli kontenjan yok'
        });
      }
    }

    // Toplam fiyat hesapla
    const unitPrice = activityDoc.discountPrice || activityDoc.price;
    const calculatedPrice = totalPrice || (unitPrice * guestCount);

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
      paymentMethod: paymentMethod || 'cash',
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
      let slot = availability.timeSlots.find(s => s.time === time);
      if (!slot) {
        slot = { time, capacity: baseCapacity, booked: 0 };
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
  } catch (error) {
    console.error('Booking create error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/bookings/id/:id
// @desc    Rezervasyonu ID ile getir
// @access  Public
router.get('/id/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('activity', 'name thumbnailImage location duration');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/bookings/:ref
// @desc    Rezervasyon durumu sorgula
// @access  Public
router.get('/:ref', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingRef: req.params.ref })
      .populate('activity', 'name thumbnailImage location duration');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ ADMIN ROUTES ============

// @route   GET /api/admin/bookings
// @desc    Tüm rezervasyonlar
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate } = req.query;

    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('activity', 'name category thumbnailImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/admin/bookings/stats
// @desc    Rezervasyon istatistikleri
// @access  Private/Admin
router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalBookings,
      todayBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      paidRevenue,
      confirmedRevenue,
      totalActivities
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ date: { $gte: today } }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
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
        paidRevenue: paidRevenue[0]?.total || 0,
        totalRevenue: paidRevenue[0]?.total || 0, // backward compatibility
        confirmedRevenue: confirmedRevenue[0]?.total || 0,
        totalActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/bookings/admin/analytics
// @desc    Özet analytics verisi
// @access  Private/Admin
router.get('/admin/analytics', protect, adminOnly, async (req, res) => {
  try {
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
        pageViews: { today: 0, week: 0, month: 0 }, // Google Analytics yerine placeholder
        bookings: { today: bookingsToday, week: bookingsWeek, month: bookingsMonth },
        revenue: { today: 0, week: 0, month: revenueMonth[0]?.total || 0 },
        topActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/admin/bookings/:id
// @desc    Rezervasyon güncelle
// @access  Private/Admin
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const updateData = {};
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
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/bookings/:id
// @desc    Rezervasyon sil
// @access  Private/Admin
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Rezervasyon silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
