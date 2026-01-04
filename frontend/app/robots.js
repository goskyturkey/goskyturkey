export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/payment/', '/booking/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin/', '/api/', '/payment/'],
            },
            {
                userAgent: 'Googlebot-Image',
                allow: ['/images/', '/icons/'],
            },
        ],
        sitemap: 'https://goskyturkey.com/sitemap.xml',
    };
}
