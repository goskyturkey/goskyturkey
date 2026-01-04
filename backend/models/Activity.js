const mongoose = require('mongoose');
const slugify = require('slugify');

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Aktivite adı zorunludur'],
    trim: true,
    maxlength: [100, 'Aktivite adı 100 karakterden uzun olamaz']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Açıklama zorunludur']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Kısa açıklama 200 karakterden uzun olamaz']
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    enum: ['paragliding', 'gyrocopter', 'balloon']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur'],
    min: [0, 'Fiyat negatif olamaz']
  },
  discountPrice: {
    type: Number,
    min: [0, 'İndirimli fiyat negatif olamaz']
  },
  currency: {
    type: String,
    default: 'TRY',
    enum: ['TRY', 'USD', 'EUR']
  },
  duration: {
    type: String,
    required: [true, 'Süre zorunludur']
  },
  location: {
    type: String,
    required: [true, 'Konum zorunludur']
  },
  meetingPoint: {
    type: String
  },
  images: [{
    type: String
  }],
  thumbnailImage: {
    type: String
  },
  includes: [{
    type: String
  }],
  excludes: [{
    type: String
  }],
  maxParticipants: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Slug oluşturma
activitySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
