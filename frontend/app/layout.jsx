import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Providers from '@/components/Providers';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    metadataBase: new URL('https://goskyturkey.com'),
    title: {
        default: 'GoSky Turkey | Yamaç Paraşütü, Gyrocopter ve Balon Turları',
        template: '%s | GoSky Turkey',
    },
    description: 'İzmir, Denizli-Pamukkale, Fethiye-Ölüdeniz ve Manisa\'da yamaç paraşütü, gyrocopter ve balon turları. TÜRSAB lisanslı, profesyonel pilotlar.',
    keywords: ['yamaç paraşütü', 'paragliding', 'gyrocopter', 'balon turu', 'pamukkale', 'fethiye', 'ölüdeniz', 'izmir', 'türkiye tur'],
    authors: [{ name: 'GoSky Turkey' }],
    creator: 'GoSky Turkey',
    publisher: 'GoSky Turkey',
    openGraph: {
        title: 'GoSky Turkey | Yamaç Paraşütü, Gyrocopter ve Balon Turları',
        description: 'İzmir, Denizli-Pamukkale, Fethiye-Ölüdeniz ve Manisa\'da unutulmaz macera turları.',
        url: 'https://goskyturkey.com',
        siteName: 'GoSky Turkey',
        locale: 'tr_TR',
        type: 'website',
        images: ['/images/paragliding.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GoSky Turkey',
        description: 'Yamaç paraşütü, gyrocopter ve balon turları',
        images: ['/images/paragliding.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

async function getSettings() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/settings`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export default async function RootLayout({ children }) {
    const settings = await getSettings();
    const phone = settings?.phone || '+90 555 123 4567';
    const siteName = settings?.siteName || 'GoSky Turkey';

    return (
        <html lang="tr">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#1a1a2e" />
            </head>
            <body className={inter.className}>
                <Providers>
                    <Header phone={phone} />
                    <main className="app">
                        {children}
                    </main>
                    <Footer siteName={siteName} phone={phone} />
                </Providers>

                {/* Google Analytics */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-81MZL78LTY"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-81MZL78LTY');
                    `}
                </Script>

                {/* Floating WhatsApp Button */}
                <a
                    href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-float"
                    aria-label="WhatsApp ile iletişime geçin"
                >
                    <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
                        <path d="M16.004 0h-.008C7.174 0 0 7.174 0 16c0 3.498 1.126 6.74 3.042 9.376L1.052 31.14l5.964-1.966A15.915 15.915 0 0016.004 32C24.83 32 32 24.826 32 16S24.83 0 16.004 0zm9.29 22.61c-.39 1.1-1.93 2.014-3.168 2.28-.848.18-1.956.324-5.686-1.222-4.774-1.98-7.848-6.836-8.085-7.15-.227-.314-1.91-2.546-1.91-4.858s1.209-3.446 1.638-3.918c.35-.384.925-.566 1.477-.566.18 0 .342.01.488.018.43.018.644.042 .928.718.356.848 1.226 2.986 1.332 3.204.108.218.18.472.036.758-.135.294-.204.476-.402.732-.198.256-.415.572-.594.768-.198.218-.404.454-.174.89.23.436 1.024 1.69 2.2 2.738 1.51 1.346 2.784 1.764 3.178 1.96.394.196.624.164.854-.1.23-.264.984-1.148 1.246-1.542.262-.394.524-.328.884-.196.36.132 2.288 1.08 2.68 1.278.392.196.654.294.75.458.097.164.097.948-.293 2.048z" />
                    </svg>
                </a>
            </body>
        </html>
    );
}
