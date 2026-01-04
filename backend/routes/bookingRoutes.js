const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');
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
    const guestCount = guests || participants || 1;

    // Aktivite kontrolü
    const activityDoc = await Activity.findById(actId);
    if (!activityDoc || !activityDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    // Toplam fiyat hesapla
    const unitPrice = activityDoc.discountPrice || activityDoc.price;
    const calculatedPrice = totalPrice || (unitPrice * guestCount);

    const booking = await Booking.create({
      activity: actId,
      date,
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
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ date: { $gte: today } }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        pendingBookings,
        totalRevenue: totalRevenue[0]?.total || 0
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
