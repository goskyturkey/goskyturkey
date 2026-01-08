'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [status, setStatus] = useState('loading');
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const statusParam = searchParams.get('status') || 'failed';
        const bookingId = searchParams.get('bookingId');
        const bookingRef = searchParams.get('ref');
        const error = searchParams.get('error');
        const method = searchParams.get('method');

        setStatus(statusParam);
        setDetails({ bookingId, bookingRef, error, method });
    }, [searchParams]);

    if (status === 'loading') {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <>
            {status === 'success' ? (
                <>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
                        {t('payment.success.title')}
                    </h1>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        {t('payment.success.description')}
                    </p>
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        width: '100%',
                    }}>
                        <p>✅ {t('payment.success.received')}</p>
                        {details?.bookingRef && <p>📄 {t('payment.success.bookingNo')}: {details.bookingRef}</p>}
                        <p>📧 {t('payment.success.emailSent')}</p>
                        <p>💬 {t('payment.success.whatsapp')}</p>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😔</div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
                        {t('payment.failed.title')}
                    </h1>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        {t('payment.failed.description')}
                    </p>
                    {details?.error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.12)',
                            borderRadius: '10px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            color: '#fecdd3'
                        }}>
                            {t('common.error')}: {details.error}
                        </div>
                    )}
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
                {t('common.backToHome')}
            </Link>
        </>
    );
}

export default function PaymentResultPage() {
    const { t } = useLanguage();

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
                <Image src="/images/logo.webp" alt="GoSkyTurkey" width={120} height={35} />
            </Link>

            <Suspense fallback={<div>{t('common.loading')}</div>}>
                <PaymentResultContent />
            </Suspense>
        </div>
    );
}
