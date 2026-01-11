import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales: ['tr', 'en', 'de', 'fr', 'hi', 'zh'],
    defaultLocale: 'tr',
    localePrefix: 'always'
});

export default function middleware(request) {
    const { pathname } = request.nextUrl;

    // Admin, API, ve Uploads istekleri için intl middleware çalıştırma
    // Bu rotalar lokalizasyondan bağımsız çalışır
    let response;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/uploads')) {
        response = NextResponse.next();
    } else {
        response = intlMiddleware(request);
    }

    // --- Security Headers Logic (Mevcut Kod) ---
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiOrigin = (() => {
        try {
            return apiUrl ? new URL(apiUrl).origin : null;
        } catch {
            return null;
        }
    })();

    const connectSrc = [
        "'self'",
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        'https://api.iyzipay.com',
        'https://sandbox-api.iyzipay.com',
    ];
    if (apiOrigin) {
        connectSrc.push(apiOrigin);
    }
    // ... existing headers code ...
    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    // CSP
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' data: https: blob:; " +
        `connect-src ${connectSrc.join(' ')}; ` +
        "frame-src https://sandbox-api.iyzipay.com https://api.iyzipay.com https://www.google.com https://maps.google.com; " +
        "worker-src 'self' blob:;"
    );

    return response;
}

export const config = {
    // Admin, API, statik dosyalar, Next.js internal dosyaları ve Uploads hariç her şeyi yakala
    matcher: [
        '/((?!api|admin|uploads|.*\\/uploads|.*\\/uploads\\/.*|_next/static|_next/image|favicon.ico|images|icons|.*\\.png$|.*\\.jpg$|.*\\.webp$|.*\\.svg$).*)',
    ],
};
