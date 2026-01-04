require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const faqRoutes = require('./routes/faqRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const helmet = require('helmet');

// Basic runtime configuration checks
const isProd = process.env.NODE_ENV === 'production';
const hasDefaultJwt = !process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your-super-secret');
if (isProd && hasDefaultJwt) {
  throw new Error('JWT_SECRET production değeri ayarlanmadı. Lütfen güvenli bir anahtar belirleyin.');
}
if (hasDefaultJwt) {
  console.warn('⚠️  JWT_SECRET varsayılan/boş. Üretimde mutlaka güçlü bir anahtar kullanın.');
}
['IYZICO_API_KEY', 'IYZICO_SECRET_KEY', 'IYZICO_URI'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`ℹ️  ${key} tanımlı değil, env dosyasını kontrol edin.`);
  }
});

// Connect to MongoDB
connectDB();

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.set('trust proxy', 1);
app.use(limiter);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration - restrict to known origins
const parseOrigins = (origins) => origins.split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS || 'https://goskyturkey.com,http://localhost:3001,http://localhost:3000');
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/faq', faqRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GoSky Turkey API is running!',
    timestamp: new Date().toISOString()
  });
});

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'İstek karşılanamadı (404)'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GoSky Turkey server running on port ${PORT}`);
});
