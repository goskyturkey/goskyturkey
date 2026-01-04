import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '2rem',
            background: '#0f0f23',
            color: 'white',
        }}>
            <h1 style={{ fontSize: '6rem', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Sayfa Bulunamadı</h2>
            <p style={{ marginBottom: '2rem', opacity: 0.7 }}>
                Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
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
        </div>
    );
}
