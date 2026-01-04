const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

// @route   GET /api/activities
// @desc    Tüm aktif aktiviteleri listele
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const activities = await Activity.find(query)
      .select('-__v')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/activities/featured
// @desc    Öne çıkan aktiviteler
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const activities = await Activity.find({ isActive: true, isFeatured: true })
      .select('-__v')
      .sort({ order: 1 })
      .limit(6);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/activities/:slug
// @desc    Tekil aktivite detayı
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      slug: req.params.slug,
      isActive: true
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ ADMIN ROUTES ============

// @route   GET /api/admin/activities
// @desc    Tüm aktiviteleri listele (admin)
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/admin/activities
// @desc    Yeni aktivite ekle
// @access  Private/Admin
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const activity = await Activity.create(req.body);

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Activity create error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir aktivite zaten mevcut'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/activities/:id
// @desc    Aktivite güncelle
// @access  Private/Admin
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/activities/:id
// @desc    Aktivite sil
// @access  Private/Admin
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Aktivite silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
