const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'GoSky Turkey'
  },
  siteDescription: {
    type: String
  },
  logo: {
    type: String
  },
  favicon: {
    type: String
  },
  heroImage: {
    type: String
  },
  heroTitle: {
    type: String,
    default: 'Türkiye\'nin En Güzel Manzaralarını Keşfedin'
  },
  heroSubtitle: {
    type: String,
    default: 'Yamaç paraşütü, gyrocopter ve balon turları ile gökyüzünden eşsiz deneyimler yaşayın.'
  },
  contactEmail: {
    type: String
  },
  phone: {
    type: String
  },
  whatsapp: {
    type: String
  },
  address: {
    type: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  trustBadges: [{
    icon: String,
    value: String,
    text: String
  }],
  whyUsItems: [{
    type: String
  }],
  whyUsImage: {
    type: String
  },
  testimonials: [{
    name: String,
    location: String,
    text: String,
    rating: { type: Number, default: 5 }
  }],
  stepperItems: [{
    title: String,
    description: String
  }],
  aboutText: {
    type: String
  },
  termsText: {
    type: String
  },
  privacyText: {
    type: String
  },
  seoTitle: {
    type: String
  },
  seoDescription: {
    type: String
  },
  seoKeywords: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
