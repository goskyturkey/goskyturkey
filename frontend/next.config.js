/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'goskyturkey.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000, // 1 yıl cache
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // /uploads/ zaten WebP optimize edilmiş, tekrar optimize etme
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
    },
    // Performance optimizations
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,

    // Cache headers for static assets
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
        const backendBase = apiUrl.replace(/\/api\/?$/, '');
        const apiDestination = `${apiUrl.replace(/\/$/, '')}/:path*`;

        return [
            {
                source: '/api/:path*',
                destination: apiDestination,
            },
            {
                source: '/uploads/:path*',
                destination: `${backendBase}/uploads/:path*`,
            },
        ];
    },
};

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.js');

module.exports = withNextIntl(nextConfig);
