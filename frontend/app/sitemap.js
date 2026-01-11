
// Force dynamic to avoid build-time API calls
export const dynamic = 'force-dynamic';

export default async function sitemap() {
    const baseUrl = 'https://goskyturkey.com';
    // Docker içindeki server adresi veya public adres
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    let activities = [];
    let locales = ['tr']; // Varsayılan olarak en azından TR olsun

    try {
        // Hem Aktiviteleri hem Dilleri PARALEL olarak çekiyoruz (Hız için)
        const [activitiesRes, languagesRes] = await Promise.all([
            fetch(`${API_URL}/activities`, { cache: 'no-store' }),
            fetch(`${API_URL}/languages`, { cache: 'no-store' })
        ]);

        // Aktiviteleri işle
        if (activitiesRes.ok) {
            const payload = await activitiesRes.json();
            activities = payload.data || payload;
        }

        // Dilleri işle (Sadece 'active' olanları al)
        if (languagesRes.ok) {
            const langPayload = await languagesRes.json();
            const activeLanguages = langPayload.data || langPayload;

            if (Array.isArray(activeLanguages)) {
                // Sadece kodları al (tr, en, de...) ve aktif olanları filtrele
                const dynamicLocales = activeLanguages
                    .filter(l => l.active)
                    .map(l => l.code);

                if (dynamicLocales.length > 0) {
                    locales = dynamicLocales;
                }
            }
        }
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    // Statik sayfalarımız
    const staticRoutes = ['', '/gallery', '/faq'];
    const allUrls = [];

    // Varsayılan dil (genelde 'tr')
    const defaultLocale = 'tr';

    // 1. Statik sayfalar için döngü
    staticRoutes.forEach(route => {
        const urlEntry = {
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: route === '' ? 1 : 0.8,
            alternates: {
                languages: {}
            }
        };

        locales.forEach(lang => {
            const langUrl = lang === defaultLocale
                ? `${baseUrl}${route}`
                : `${baseUrl}/${lang}${route}`;

            urlEntry.alternates.languages[lang] = langUrl;
        });

        allUrls.push(urlEntry);
    });

    // 2. Dinamik Aktiviteler için döngü
    if (Array.isArray(activities)) {
        activities.forEach(activity => {
            const urlEntry = {
                url: `${baseUrl}/activity/${activity.slug}`,
                lastModified: new Date(activity.updatedAt || new Date()),
                changeFrequency: 'weekly',
                priority: 0.9,
                alternates: {
                    languages: {}
                }
            };

            locales.forEach(lang => {
                const langUrl = lang === defaultLocale
                    ? `${baseUrl}/activity/${activity.slug}`
                    : `${baseUrl}/${lang}/activity/${activity.slug}`;

                urlEntry.alternates.languages[lang] = langUrl;
            });

            allUrls.push(urlEntry);
        });
    }

    return allUrls;
}
