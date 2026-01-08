import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import Activity from '../../src/models/Activity';
import Booking from '../../src/models/Booking';

// Mock iyzipay
const mockCheckoutFormInitialize = jest.fn();
const mockCheckoutFormRetrieve = jest.fn();

jest.mock('../../src/config/iyzico', () => ({
    default: {
        checkoutFormInitialize: {
            create: (req: any, callback: Function) => mockCheckoutFormInitialize(req, callback)
        },
        checkoutForm: {
            retrieve: (req: any, callback: Function) => mockCheckoutFormRetrieve(req, callback)
        }
    }
}));

// Import routes after mocking
import paymentRoutes from '../../src/routes/paymentRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/payment', paymentRoutes);

describe('Payment API - Integration Tests', () => {
    let testActivity: any;
    let testBooking: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Create test activity
        testActivity = await Activity.create({
            name: { tr: 'Yamaç Paraşütü', en: 'Paragliding' },
            slug: 'yamac-parasutu',
            description: { tr: 'Harika deneyim', en: 'Great experience' },
            location: { tr: 'Fethiye', en: 'Fethiye' },
            category: 'paragliding',
            price: 1500,
            currency: 'TRY',
            images: ['/images/para1.jpg'],
            includes: [],
            excludes: [],
            maxParticipants: 20,
            isActive: true,
            isFeatured: true,
            order: 1
        });

        // Create test booking
        testBooking = await Booking.create({
            activity: testActivity._id,
            customerName: 'Ali Veli',
            customerEmail: 'ali@test.com',
            customerPhone: '+905551234567',
            guestCount: 2,
            bookingDate: new Date('2026-03-15'),
            totalPrice: 3000,
            status: 'pending',
            paymentStatus: 'pending',
            bookingRef: 'GST-INT-001'
        });
    });

    describe('POST /api/payment/init', () => {
        it('should initialize payment successfully', async () => {
            mockCheckoutFormInitialize.mockImplementation((req, callback) => {
                callback(null, {
                    status: 'success',
                    checkoutFormContent: '<form>Mock Form</form>',
                    token: 'mock-token-123',
                    tokenExpireTime: 1800
                });
            });

            const res = await request(app)
                .post('/api/payment/init')
                .send({ bookingId: testBooking._id.toString() });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.checkoutFormContent).toBeTruthy();
            expect(res.body.data.token).toBe('mock-token-123');
        });

        it('should return 400 for invalid booking ID', async () => {
            const res = await request(app)
                .post('/api/payment/init')
                .send({ bookingId: 'undefined' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 for non-existent booking', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post('/api/payment/init')
                .send({ bookingId: fakeId.toString() });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('should handle iyzico error gracefully', async () => {
            mockCheckoutFormInitialize.mockImplementation((req, callback) => {
                callback(new Error('iyzico connection failed'), null);
            });

            const res = await request(app)
                .post('/api/payment/init')
                .send({ bookingId: testBooking._id.toString() });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        it('should handle iyzico form creation failure', async () => {
            mockCheckoutFormInitialize.mockImplementation((req, callback) => {
                callback(null, {
                    status: 'failure',
                    errorCode: '10051',
                    errorMessage: 'Invalid API credentials'
                });
            });

            const res = await request(app)
                .post('/api/payment/init')
                .send({ bookingId: testBooking._id.toString() });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/payment/status/:bookingId', () => {
        it('should return payment status', async () => {
            const res = await request(app)
                .get(`/api/payment/status/${testBooking._id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.paymentStatus).toBe('pending');
            expect(res.body.data.bookingRef).toBe('GST-INT-001');
        });

        it('should return 404 for non-existent booking', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/payment/status/${fakeId}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/payment/status/ref/:bookingRef', () => {
        it('should return payment status by booking ref', async () => {
            const res = await request(app)
                .get('/api/payment/status/ref/GST-INT-001');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalPrice).toBe(3000);
        });
    });

    describe('GET /api/payment/test', () => {
        it('should return iyzico configuration status', async () => {
            const res = await request(app)
                .get('/api/payment/test');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('iyzico');
        });
    });

    describe('POST /api/payment/callback', () => {
        beforeEach(async () => {
            // Update booking with token
            await Booking.findByIdAndUpdate(testBooking._id, {
                'paymentDetails.token': 'callback-token-123'
            });
        });

        it('should handle successful payment callback', async () => {
            mockCheckoutFormRetrieve.mockImplementation((req, callback) => {
                callback(null, {
                    status: 'success',
                    paymentStatus: 'SUCCESS',
                    paymentId: 'PAY123',
                    paymentTransactionId: 'TXN456',
                    cardFamily: 'Visa',
                    cardType: 'CREDIT_CARD',
                    lastFourDigits: '4242'
                });
            });

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ token: 'callback-token-123' });

            expect(res.status).toBe(302); // Redirect
            expect(res.headers.location).toContain('status=success');

            // Verify booking was updated
            const updatedBooking = await Booking.findById(testBooking._id);
            expect(updatedBooking?.paymentStatus).toBe('paid');
            expect(updatedBooking?.status).toBe('confirmed');
        });

        it('should handle failed payment callback', async () => {
            mockCheckoutFormRetrieve.mockImplementation((req, callback) => {
                callback(null, {
                    status: 'failure',
                    paymentStatus: 'FAILURE',
                    errorCode: '10051',
                    errorMessage: 'Card rejected'
                });
            });

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ token: 'callback-token-123' });

            expect(res.status).toBe(302); // Redirect
            expect(res.headers.location).toContain('status=failed');
        });

        it('should redirect with error for missing token', async () => {
            const res = await request(app)
                .post('/api/payment/callback')
                .send({});

            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('token_missing');
        });
    });
});
