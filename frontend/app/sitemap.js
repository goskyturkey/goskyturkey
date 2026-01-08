// Force dynamic to avoid build-time API calls
export const dynamic = 'force-dynamic';

export default async function sitemap() {
    const baseUrl = 'https://goskyturkey.com';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    let activities = [];
    try {
        const res = await fetch(`${API_URL}/activities`, { cache: 'no-store' });
        const payload = await res.json();
        activities = payload.data || payload;
        if (!Array.isArray(activities)) {
            activities = [];
        }
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    const activityUrls = Array.isArray(activities) ? activities.map((activity) => ({
        url: `${baseUrl}/activity/${activity.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
    })) : [];

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/gallery`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        ...activityUrls,
    ];
}
