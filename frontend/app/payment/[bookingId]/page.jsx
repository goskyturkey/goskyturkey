'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PaymentPage({ params }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentHtml, setPaymentHtml] = useState(null);

    useEffect(() => {
        async function initPayment() {
            try {
                // Get booking details
                const bookingRes = await fetch(`/api/bookings/${params.bookingId}`);
                if (bookingRes.ok) {
                    const bookingData = await bookingRes.json();
                    setBooking(bookingData);

                    // Initiate payment
                    const paymentRes = await fetch(`/api/payment/initiate/${params.bookingId}`, {
                        method: 'POST',
                    });

                    if (paymentRes.ok) {
                        const paymentData = await paymentRes.json();
                        if (paymentData.checkoutFormContent) {
                            setPaymentHtml(paymentData.checkoutFormContent);
                        }
                    }
                }
            } catch (error) {
                console.error('Payment init error:', error);
            } finally {
                setLoading(false);
            }
        }
        initPayment();
    }, [params.bookingId]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div style={{ fontSize: '1.2rem' }}>Ödeme hazırlanıyor...</div>
                <p style={{ opacity: 0.7, marginTop: '1rem' }}>iyzico güvenli ödeme altyapısı</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem' }}>
                <Link href="/">
                    <Image src="/images/logo.png" alt="GoSky Turkey" width={120} height={35} />
                </Link>
            </header>

            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Ödeme</h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>iyzico güvenli ödeme altyapısı ile</p>

            {/* Booking Summary */}
            {booking && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                }}>
                    <h3 style={{ marginBottom: '1rem' }}>Rezervasyon Özeti</h3>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        <p>👤 {booking.name}</p>
                        <p>📧 {booking.email}</p>
                        <p>📅 {new Date(booking.date).toLocaleDateString('tr-TR')}</p>
                        <p>👥 {booking.guests} Kişi</p>
                        <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                        }}>
                            Toplam: {booking.totalPrice} ₺
                        </div>
                    </div>
                </div>
            )}

            {/* iyzico Payment Form */}
            {paymentHtml ? (
                <div
                    dangerouslySetInnerHTML={{ __html: paymentHtml }}
                    style={{ minHeight: '400px' }}
                />
            ) : (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <p>Ödeme formu yüklenemedi.</p>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: '#f97316',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                        }}
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            )}

            {/* Test Card Info */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                fontSize: '0.85rem',
            }}>
                <strong>Test Kartı (Sandbox):</strong>
                <p style={{ marginTop: '0.5rem', fontFamily: 'monospace' }}>
                    Kart No: 5528790000000008<br />
                    SKT: 12/30 | CVV: 123
                </p>
            </div>
        </div>
    );
}
