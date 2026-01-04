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
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.API_URL || 'http://localhost:3000/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
