const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    unique: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, 'Aktivite seçimi zorunludur']
  },
  date: {
    type: Date,
    required: [true, 'Tarih zorunludur']
  },
  time: {
    type: String,
    default: '09:00'
  },
  participants: {
    type: Number,
    default: 1,
    min: [1, 'En az 1 katılımcı olmalı']
  },
  guests: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  // Yeni format - düz alanlar
  customerName: {
    type: String,
    required: [true, 'Ad soyad zorunludur']
  },
  customerEmail: {
    type: String,
    required: [true, 'Email zorunludur'],
    match: [/^\S+@\S+\.\S+$/, 'Geçerli bir email adresi giriniz']
  },
  customerPhone: {
    type: String,
    required: [true, 'Telefon zorunludur']
  },
  notes: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash'],
    default: 'cash'
  },
  // Eski format - geriye uyumluluk
  customerInfo: {
    firstName: String,
    lastName: String,
    name: String,
    email: String,
    phone: String,
    notes: String
  },
  paymentDetails: {
    method: String,
    transactionId: String,
    paidAt: Date
  }
}, {
  timestamps: true
});

// Booking reference oluşturma
bookingSchema.pre('save', function () {
  if (!this.bookingRef) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingRef = `GST-${timestamp}-${random}`;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
