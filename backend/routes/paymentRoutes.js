const express = require('express');
const router = express.Router();
const Iyzipay = require('iyzipay');
const iyzipay = require('../config/iyzico');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Benzersiz conversation ID oluştur
const generateConversationId = () => {
    return 'GST' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const initPayment = async (req, res) => {
    try {
        const bookingId = req.body.bookingId || req.params.bookingId;

        // Booking'i bul
        const booking = await Booking.findById(bookingId).populate('activity');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Rezervasyon bulunamadı'
            });
        }

        const conversationId = generateConversationId();
        const price = booking.totalPrice.toFixed(2);
        const paidPrice = price;

        // iyzico Checkout Form isteği
        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: conversationId,
            price: price,
            paidPrice: paidPrice,
            currency: Iyzipay.CURRENCY.TRY,
            basketId: booking._id.toString(),
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: `${process.env.BASE_URL || 'https://goskyturkey.com'}/api/payment/callback`,
            enabledInstallments: [1, 2, 3, 6, 9, 12],
            buyer: {
                id: booking._id.toString(),
                name: booking.customerName?.split(' ')[0] || 'Misafir',
                surname: booking.customerName?.split(' ').slice(1).join(' ') || 'Kullanıcı',
                gsmNumber: booking.customerPhone || '+905551234567',
                email: booking.customerEmail || 'misafir@goskyturkey.com',
                identityNumber: '11111111111', // TC kimlik (zorunlu alan)
                registrationAddress: 'Türkiye',
                ip: req.ip || '85.34.78.112',
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
                    name: booking.activity?.name || 'Tur Aktivitesi',
                    category1: 'Deneyim',
                    category2: 'Tur',
                    itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                    price: price
                }
            ]
        };

        // Checkout Form oluştur
        iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
            if (err) {
                console.error('iyzico init error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Ödeme başlatılamadı',
                    error: err.message
                });
            }

            if (result.status !== 'success') {
                console.error('iyzico result error:', result);
                return res.status(400).json({
                    success: false,
                    message: result.errorMessage || 'Ödeme formu oluşturulamadı',
                    errorCode: result.errorCode
                });
            }

            // Booking'e payment token'ı kaydet
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
        });
    } catch (error) {
        console.error('Payment init error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @route   POST /api/payment/init
// @desc    iyzico Checkout Form başlat (body bookingId)
// @access  Public
router.post('/init', initPayment);

// @route   POST /api/payment/initiate/:bookingId
// @desc    iyzico Checkout Form başlat (path bookingId)
// @access  Public
router.post('/initiate/:bookingId', initPayment);

// @route   POST /api/payment/callback
// @desc    iyzico 3D Secure callback
// @access  Public
router.post('/callback', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.redirect('/payment/result?status=failed&error=token_missing');
        }

        // Ödeme sonucunu kontrol et
        const request = {
            locale: Iyzipay.LOCALE.TR,
            token: token
        };

        iyzipay.checkoutForm.retrieve(request, async (err, result) => {
            if (err) {
                console.error('iyzico retrieve error:', err);
                return res.redirect('/payment/result?status=failed&error=retrieve_error');
            }

            // Booking'i bul ve güncelle
            const booking = await Booking.findOne({ 'paymentDetails.token': token });

            if (!booking) {
                return res.redirect('/payment/result?status=failed&error=booking_not_found');
            }

            if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                // Ödeme başarılı
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

                return res.redirect(`/payment/result?status=success&method=online&bookingId=${booking._id}&ref=${booking.bookingRef}`);
            } else {
                // Ödeme başarısız
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'failed',
                    'paymentDetails.errorCode': result.errorCode,
                    'paymentDetails.errorMessage': result.errorMessage
                });

                return res.redirect(`/payment/result?status=failed&bookingId=${booking._id}&error=${result.errorCode || 'payment_failed'}`);
            }
        });
    } catch (error) {
        console.error('Payment callback error:', error);
        res.redirect('/payment/result?status=failed&error=server_error');
    }
});

// @route   GET /api/payment/status/:bookingId
// @desc    Ödeme durumu kontrol
// @access  Public
router.get('/status/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .select('paymentStatus status bookingRef totalPrice');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Rezervasyon bulunamadı'
            });
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   GET /api/payment/status/ref/:bookingRef
// @desc    Rezervasyon referansı ile ödeme durumu
// @access  Public
router.get('/status/ref/:bookingRef', async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingRef: req.params.bookingRef })
            .select('paymentStatus status bookingRef totalPrice');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Rezervasyon bulunamadı'
            });
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// @route   GET /api/payment/test
// @desc    iyzico bağlantı testi
// @access  Public
router.get('/test', (req, res) => {
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

module.exports = router;
