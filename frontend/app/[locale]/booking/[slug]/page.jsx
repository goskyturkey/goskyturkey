import BookingForm from '@/components/BookingForm';
import { DEFAULT_ACTIVITIES_MAP } from '@/lib/constants';
import { notFound } from 'next/navigation';

async function getActivity(slug) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/activities/${slug}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Not found');
        const result = await res.json();
        return result.data || result;
    } catch (error) {
        return DEFAULT_ACTIVITIES_MAP[slug] || null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const activity = await getActivity(slug);
    if (!activity) return { title: 'Aktivite Bulunamadı' };
    return {
        title: `Rezervasyon: ${activity.name} | GoSkyTurkey`,
        description: `${activity.name} için rezervasyon yapın. En iyi fiyat garantisi ve güvenli ödeme.`,
        openGraph: { title: `Rezervasyon: ${activity.name}`, description: activity.description, images: [activity.image] },
    };
}

export default async function BookingPage({ params }) {
    const { slug } = await params;
    const activity = await getActivity(slug);

    if (!activity) {
        notFound();
    }

    return <BookingForm activity={activity} />;
}
