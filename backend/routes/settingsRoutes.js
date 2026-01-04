const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Site ayarlarını getir
// @access  Public
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Eğer ayarlar yoksa varsayılan oluştur
    if (!settings) {
      settings = await Settings.create({
        siteName: 'GoSky Turkey',
        heroTitle: 'Gökyüzüne Yeni Bir Bakış',
        heroSubtitle: 'Yamaç paraşütü, gyrocopter ve balon turları ile unutulmaz deneyimler'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Ayarları güncelle
// @access  Private/Admin
router.put('/admin', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
