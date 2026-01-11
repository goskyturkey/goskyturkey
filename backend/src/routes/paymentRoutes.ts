import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import Iyzipay from 'iyzipay';
import iyzipay from '../config/iyzico.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Booking from '../models/Booking.js';
import { IActivity } from '../types/models.js';

const router = Router();

const generateConversationId = (): string => {
    return 'GST-' + crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
};

const callbackUrl = (): string =>
    `${process.env.BASE_URL || 'https://goskyturkey.com'}/api/payment/callback`;

const ensurePositivePrice = (price: number) => Number.isFinite(price) && price > 0;

const initPayment = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = (req.body?.bookingId || req.params?.bookingId) as string | undefined;

    if (!bookingId || bookingId === 'undefined') {
        res.status(400).json({
            success: false,
            message: 'Geçersiz rezervasyon bilgisi'
        });
        return;
    }

    const booking = await Booking.findById(bookingId).populate('activity');
    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    const price = Number(booking.totalPrice);
    if (!ensurePositivePrice(price)) {
        res.status(400).json({
            success: false,
            message: 'Geçerli bir tutar bulunamadı'
        });
        return;
    }

    const conversationId = generateConversationId();
    const activity = booking.activity as IActivity | undefined;
    const activityName = (activity?.name as Record<string, string> | undefined)?.tr || 'Tur Aktivitesi';

    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        price: price.toFixed(2),
        paidPrice: price.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: booking._id.toString(),
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: callbackUrl(),
        enabledInstallments: [1, 2, 3, 6, 9, 12],
        buyer: {
            id: booking._id.toString(),
            name: booking.customerName?.split(' ')[0] || 'Misafir',
            surname: booking.customerName?.split(' ').slice(1).join(' ') || 'Kullanıcı',
            gsmNumber: booking.customerPhone || '+905551234567',
            email: booking.customerEmail || 'misafir@goskyturkey.com',
            identityNumber: (booking as any).customerIdentityNumber || '00000000000',
            registrationAddress: (booking as any).customerAddress || 'Türkiye',
            ip: req.ip || '0.0.0.0',
            city: 'Istanbul',
            country: 'Turkey'
        },
        shippingAddress: {
            contactName: booking.customerName || 'Misafir',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Türkiye'
        },
        billingAddress: {
            contactName: booking.customerName || 'Misafir',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Türkiye'
        },
        basketItems: [
            {
                id: booking.activity?._id?.toString() || 'ACT001',
                name: activityName,
                category1: 'Deneyim',
                category2: 'Tur',
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: price.toFixed(2)
            }
        ]
    };

    await new Promise<void>((resolve) => {
        iyzipay.checkoutFormInitialize.create(request, async (err: Error | null, result: any) => {
            if (err) {
                console.error('iyzico init error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Ödeme başlatılamadı',
                    error: err.message
                });
                return resolve();
            }

            if (result.status !== 'success') {
                console.error('iyzico result error:', result);
                res.status(400).json({
                    success: false,
                    message: result.errorMessage || 'Ödeme formu oluşturulamadı',
                    errorCode: result.errorCode
                });
                return resolve();
            }

            await Booking.findByIdAndUpdate(bookingId, {
                'paymentDetails.conversationId': conversationId,
                'paymentDetails.token': result.token
            });

            res.json({
                success: true,
                data: {
                    bookingId: booking._id,
                    checkoutFormContent: result.checkoutFormContent,
                    token: result.token,
                    tokenExpireTime: result.tokenExpireTime
                }
            });
            return resolve();
        });
    });
});

router.post('/init', initPayment);
router.post('/initiate/:bookingId', initPayment);

// iyzico 3D secure callback
router.post('/callback', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };

    if (!token) {
        res.redirect('/payment/result?status=failed&error=token_missing');
        return;
    }

    const request = { locale: Iyzipay.LOCALE.TR, token };

    await new Promise<void>((resolve) => {
        iyzipay.checkoutForm.retrieve(request, async (err: Error | null, result: any) => {
            if (err) {
                console.error('iyzico retrieve error:', err);
                res.redirect('/payment/result?status=failed&error=retrieve_error');
                return resolve();
            }

            const booking = await Booking.findOne({ 'paymentDetails.token': token });

            if (!booking) {
                res.redirect('/payment/result?status=failed&error=booking_not_found');
                return resolve();
            }

            if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                await Booking.findByIdAndUpdate(booking._id, {
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    'paymentDetails.method': 'iyzico',
                    'paymentDetails.transactionId': result.paymentId,
                    'paymentDetails.paidAt': new Date(),
                    'paymentDetails.paymentTransactionId': result.paymentTransactionId,
                    'paymentDetails.cardFamily': result.cardFamily,
                    'paymentDetails.cardType': result.cardType,
                    'paymentDetails.lastFourDigits': result.lastFourDigits
                });

                res.redirect(`/payment/result?status=success&method=online&bookingId=${booking._id}&ref=${booking.bookingRef}`);
            } else {
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'failed',
                    'paymentDetails.errorCode': result.errorCode,
                    'paymentDetails.errorMessage': result.errorMessage
                });

                res.redirect(`/payment/result?status=failed&bookingId=${booking._id}&error=${result.errorCode || 'payment_failed'}`);
            }
            return resolve();
        });
    });
}));

router.get('/status/:bookingId', asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findById(req.params.bookingId)
        .select('paymentStatus status bookingRef totalPrice');

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: {
            paymentStatus: booking.paymentStatus,
            status: booking.status,
            bookingRef: booking.bookingRef,
            totalPrice: booking.totalPrice
        }
    });
}));

router.get('/status/ref/:bookingRef', asyncHandler(async (req: Request, res: Response) => {
    const booking = await Booking.findOne({ bookingRef: req.params.bookingRef })
        .select('paymentStatus status bookingRef totalPrice');

    if (!booking) {
        res.status(404).json({
            success: false,
            message: 'Rezervasyon bulunamadı'
        });
        return;
    }

    res.json({
        success: true,
        data: {
            paymentStatus: booking.paymentStatus,
            status: booking.status,
            bookingRef: booking.bookingRef,
            totalPrice: booking.totalPrice
        }
    });
}));

router.get('/test', (_req: Request, res: Response) => {
    const apiKeyExists = !!process.env.IYZICO_API_KEY;
    const secretKeyExists = !!process.env.IYZICO_SECRET_KEY;

    res.json({
        success: true,
        message: 'iyzico entegrasyonu hazır',
        config: {
            apiKeyConfigured: apiKeyExists,
            secretKeyConfigured: secretKeyExists,
            environment: process.env.IYZICO_URI?.includes('sandbox') ? 'sandbox' : 'production'
        }
    });
});

export default router;
