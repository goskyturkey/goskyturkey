import HomeContent from '@/components/HomeContent';
import JsonLd from '@/components/JsonLd';
import { DEFAULT_ACTIVITIES_ARRAY } from '@/lib/constants';
import './home.css';

export const revalidate = 3600;

const defaultActivities = DEFAULT_ACTIVITIES_ARRAY;

async function getActivities() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/activities`, { next: { revalidate: 3600 } });
        if (!res.ok) return defaultActivities;
        const result = await res.json();
        const data = result.data || result;
        return Array.isArray(data) && data.length > 0 ? data : defaultActivities;
    } catch (error) {
        return defaultActivities;
    }
}

async function getSettings() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const result = await res.json();
        return result.data || result;
    } catch (error) {
        return null;
    }
}

export default async function HomePage() {
    const activities = await getActivities();
    const settings = await getSettings();
    const siteName = settings?.siteName || 'GoSky Turkey';
    const phone = settings?.phone || '+90 555 123 4567';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: siteName,
        image: 'https://goskyturkey.com/images/logo.png',
        '@id': 'https://goskyturkey.com',
        url: 'https://goskyturkey.com',
        telephone: phone,
        priceRange: '$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Ölüdeniz Mah. Atatürk Cad.',
            addressLocality: 'Fethiye',
            addressRegion: 'Muğla',
            postalCode: '48340',
            addressCountry: 'TR'
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 36.5493,
            longitude: 29.1259
        },
        sameAs: [
            'https://www.youtube.com/@GoSkyTurkey',
            'https://www.instagram.com/goskyturkey/',
            'https://x.com/GoSkyTurkey',
            'https://www.facebook.com/GoSkyTurkey/'
        ]
    };

    return (
        <div className="home-page">
            <JsonLd data={schema} />
            <HomeContent activities={activities} settings={settings} />
        </div>
    );
}
