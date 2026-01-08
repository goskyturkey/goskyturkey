import Activity from '../../src/models/Activity';
import Booking from '../../src/models/Booking';

// Mock iyzipay
jest.mock('../../src/config/iyzico', () => ({
    default: {
        checkoutFormInitialize: {
            create: jest.fn()
        },
        checkoutForm: {
            retrieve: jest.fn()
        }
    }
}));

describe('Payment Module - Unit Tests', () => {
    let testActivity: any;
    let testBooking: any;

    beforeEach(async () => {
        // Create test activity
        testActivity = await Activity.create({
            name: { tr: 'Test Aktivite', en: 'Test Activity' },
            slug: 'test-aktivite',
            description: { tr: 'Test açıklama', en: 'Test description' },
            location: { tr: 'Test lokasyon', en: 'Test location' },
            category: 'paragliding',
            price: 1000,
            currency: 'TRY',
            images: ['/test.jpg'],
            includes: [],
            excludes: [],
            maxParticipants: 10,
            isActive: true,
            isFeatured: false,
            order: 1
        });

        // Create test booking
        testBooking = await Booking.create({
            activity: testActivity._id,
            customerName: 'Test Müşteri',
            customerEmail: 'test@example.com',
            customerPhone: '+905551234567',
            guestCount: 2,
            bookingDate: new Date('2026-02-15'),
            totalPrice: 2000,
            status: 'pending',
            paymentStatus: 'pending',
            bookingRef: 'GST-TEST-001'
        });
    });

    describe('Booking Model Payment Fields', () => {
        it('should create booking with pending payment status', () => {
            expect(testBooking.paymentStatus).toBe('pending');
            expect(testBooking.status).toBe('pending');
        });

        it('should have valid total price', () => {
            expect(testBooking.totalPrice).toBe(2000);
            expect(testBooking.totalPrice).toBeGreaterThan(0);
        });

        it('should have valid booking reference', () => {
            expect(testBooking.bookingRef).toBeTruthy();
            expect(testBooking.bookingRef).toMatch(/^GST-/);
        });

        it('should update payment status to paid', async () => {
            await Booking.findByIdAndUpdate(testBooking._id, {
                paymentStatus: 'paid',
                status: 'confirmed',
                'paymentDetails.method': 'iyzico',
                'paymentDetails.transactionId': 'TXN123',
                'paymentDetails.paidAt': new Date()
            });

            const updated = await Booking.findById(testBooking._id);
            expect(updated?.paymentStatus).toBe('paid');
            expect(updated?.status).toBe('confirmed');
            expect(updated?.paymentDetails?.method).toBe('iyzico');
        });

        it('should update payment status to failed', async () => {
            await Booking.findByIdAndUpdate(testBooking._id, {
                paymentStatus: 'failed',
                'paymentDetails.errorCode': '10051',
                'paymentDetails.errorMessage': 'Insufficient funds'
            });

            const updated = await Booking.findById(testBooking._id);
            expect(updated?.paymentStatus).toBe('failed');
            expect(updated?.paymentDetails?.errorCode).toBe('10051');
        });
    });

    describe('Payment Validation', () => {
        it('should require positive total price', async () => {
            const invalidBooking = new Booking({
                activity: testActivity._id,
                customerName: 'Test',
                customerEmail: 'test@example.com',
                customerPhone: '+905551234567',
                guestCount: 1,
                bookingDate: new Date(),
                totalPrice: -100,
                status: 'pending',
                paymentStatus: 'pending'
            });

            await expect(invalidBooking.save()).rejects.toThrow();
        });

        it('should require valid guest count', async () => {
            const invalidBooking = new Booking({
                activity: testActivity._id,
                customerName: 'Test',
                customerEmail: 'test@example.com',
                customerPhone: '+905551234567',
                guestCount: 0,
                bookingDate: new Date(),
                totalPrice: 1000,
                status: 'pending',
                paymentStatus: 'pending'
            });

            await expect(invalidBooking.save()).rejects.toThrow();
        });
    });

    describe('Payment Details Schema', () => {
        it('should store payment details correctly', async () => {
            const paymentDetails = {
                method: 'iyzico',
                transactionId: 'PAY123456',
                conversationId: 'CONV123',
                token: 'TOKEN123',
                paidAt: new Date(),
                cardFamily: 'Visa',
                cardType: 'Credit',
                lastFourDigits: '1234'
            };

            await Booking.findByIdAndUpdate(testBooking._id, {
                paymentDetails
            });

            const updated = await Booking.findById(testBooking._id);
            expect(updated?.paymentDetails?.method).toBe('iyzico');
            expect(updated?.paymentDetails?.transactionId).toBe('PAY123456');
            expect(updated?.paymentDetails?.cardFamily).toBe('Visa');
        });
    });
});
