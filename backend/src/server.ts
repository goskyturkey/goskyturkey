import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
// @ts-ignore
import compression from 'compression';

import connectDB from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger, requestLogger } from './utils/logger.js';

// Route imports
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Use process.cwd() for CommonJS compatibility
const rootDir = process.cwd();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic runtime configuration checks
const isProd = process.env.NODE_ENV === 'production';
const hasDefaultJwt = !process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your-super-secret');

if (isProd && hasDefaultJwt) {
    throw new Error('JWT_SECRET production değeri ayarlanmadı');
}
if (hasDefaultJwt) {
    logger.warn('JWT_SECRET varsayılan/boş. Üretimde mutlaka güçlü bir anahtar kullanın.');
}

['IYZICO_API_KEY', 'IYZICO_SECRET_KEY', 'IYZICO_URI'].forEach((key) => {
    if (!process.env[key]) {
        logger.warn(`${key} tanımlı değil, env dosyasını kontrol edin.`);
    }
});

// Connect to MongoDB
connectDB();

// Rate limiting configurations
// Rate limiting configurations
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Reduced from 200
    message: {
        success: false,
        message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Reduced from 10
    message: {
        success: false,
        message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Reduced from 30
    message: {
        success: false,
        message: 'Çok fazla ödeme isteği. Lütfen biraz bekleyin.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.set('trust proxy', 1);
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cookieParser());
app.use(requestLogger);

// CORS configuration
const parseOrigins = (origins: string): string[] =>
    origins.split(',').map(o => o.trim()).filter(Boolean);

const allowedOrigins = parseOrigins(
    process.env.ALLOWED_ORIGINS || 'https://goskyturkey.com,http://localhost:3001,http://localhost:3000'
);

app.use(cors({
    origin: function (origin, callback) {
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

// Serve static files - PM2 runs from /app/backend, so rootDir=/app/backend
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Apply rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);

// General rate limiter
app.use('/api', generalLimiter);

// API Routes
app.use('/api/activities', activityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api', uploadRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'GoSkyTurkey API is running!',
        timestamp: new Date().toISOString()
    });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`GoSkyTurkey server running on port ${PORT}`);
});

export default app;
