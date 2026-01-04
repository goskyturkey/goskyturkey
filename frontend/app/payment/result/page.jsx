'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setStatus('success');
        } else {
            setStatus('failed');
        }
    }, [searchParams]);

    if (status === 'loading') {
        return <div>Yükleniyor...</div>;
    }

    return (
        <>
            {status === 'success' ? (
                <>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
                        Rezervasyonunuz Alındı!
                    </h1>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        Ödemeniz başarıyla tamamlandı. Rezervasyon detayları email adresinize gönderildi.
                    </p>
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        width: '100%',
                    }}>
                        <p>✅ Ödeme alındı</p>
                        <p>📧 Onay emaili gönderildi</p>
                        <p>💬 WhatsApp ile iletişime geçeceğiz</p>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😔</div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
                        Ödeme Başarısız
                    </h1>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        Ödeme işlemi tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
                    </p>
                </>
            )}

            <Link
                href="/"
                style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 600,
                }}
            >
                Ana Sayfaya Dön
            </Link>
        </>
    );
}

export default function PaymentResultPage() {
    return (
        <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '2rem',
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Link href="/" style={{ marginBottom: '2rem' }}>
                <Image src="/images/logo.png" alt="GoSky Turkey" width={120} height={35} />
            </Link>

            <Suspense fallback={<div>Yükleniyor...</div>}>
                <PaymentResultContent />
            </Suspense>
        </div>
    );
}
