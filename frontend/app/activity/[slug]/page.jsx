import JsonLd from '@/components/JsonLd';
import { DEFAULT_ACTIVITIES_MAP } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import './activity.css';

export const dynamic = 'force-dynamic';

const defaultActivities = DEFAULT_ACTIVITIES_MAP;

async function getActivity(slug) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/activities/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Not found');
        const result = await res.json();
        return result.data || result;
    } catch (error) {
        return defaultActivities[slug] || null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const activity = await getActivity(slug);
    if (!activity) return { title: 'Aktivite Bulunamadı' };
    return {
        title: activity.name,
        description: activity.description,
        alternates: {
            canonical: `https://goskyturkey.com/activity/${slug}`,
        },
        openGraph: { title: `${activity.name} | GoSky Turkey`, description: activity.description, images: [activity.image] },
    };
}

export default async function ActivityPage({ params }) {
    const { slug } = await params;
    const activity = await getActivity(slug);
    if (!activity) notFound();

    const features = [
        { icon: '⏱️', text: activity.duration },
        { icon: '📍', text: activity.location },
        { icon: '👥', text: `Maks ${activity.maxParticipants || activity.maxGuests || 10} kişi` },
        { icon: '🎥', text: 'Video çekim dahil' }
    ];

    const coverImage = activity.thumbnailImage || activity.image || activity.images?.[0] || '/images/paragliding.png';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: activity.name,
        image: coverImage,
        description: activity.description,
        offers: {
            '@type': 'Offer',
            url: `https://goskyturkey.com/activity/${slug}`,
            priceCurrency: 'TRY',
            price: activity.discountPrice || activity.price,
            availability: 'https://schema.org/InStock',
            validFrom: new Date().toISOString()
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '124'
        }
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Ana Sayfa',
                item: 'https://goskyturkey.com'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: activity.name,
                item: `https://goskyturkey.com/activity/${slug}`
            }
        ]
    };

    return (
        <div className="activity-detail-page page-container">
            <JsonLd data={schema} />
            <JsonLd data={breadcrumbSchema} />

            <main className="detail-main">
                {/* Back Link */}
                <div className="back-link-wrapper">
                    <Link href="/" className="back-link">← Tüm Turlar</Link>
                </div>

                {/* Two Column Layout */}
                <div className="detail-container">
                    {/* Left: Info Section */}
                    <div className="detail-info">
                        <div className="category-tag">
                            {activity.category === 'paragliding' && '🪂 Yamaç Paraşütü'}
                            {activity.category === 'gyrocopter' && '🚁 Gyrocopter'}
                            {activity.category === 'balloon' && '🎈 Balon Turu'}
                        </div>

                        <h1 className="detail-title">{activity.name}</h1>

                        <div className="detail-features">
                            {features.map((f, i) => (
                                <div key={i} className="feature-item">
                                    <span className="feature-icon">{f.icon}</span>
                                    <span>{f.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="detail-description">
                            <h3>Açıklama</h3>
                            <p>{activity.description}</p>
                        </div>

                        <div className="detail-includes">
                            <div className="includes-section">
                                <h4>✅ Dahil Olanlar</h4>
                                <ul>{activity.includes?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </div>
                            <div className="excludes-section">
                                <h4>❌ Dahil Olmayanlar</h4>
                                <ul>{activity.excludes?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </div>
                        </div>

                        {/* Price & CTA */}
                        <div className="detail-cta">
                            <div className="price-section">
                                {activity.discountPrice ? (
                                    <>
                                        <span className="price-old">{activity.price.toLocaleString()} ₺</span>
                                        <span className="price-current">{activity.discountPrice.toLocaleString()} ₺</span>
                                    </>
                                ) : (
                                    <span className="price-current">{activity.price?.toLocaleString()} ₺</span>
                                )}
                                <span className="price-per">/ kişi</span>
                            </div>
                            <Link href={`/booking/${activity.slug}`} className="cta-button">Rezervasyon Yap</Link>
                        </div>
                    </div>

                    {/* Right: Gallery */}
                    <div className="detail-gallery">
                        <div className="main-image">
                            <Image src={coverImage} alt={activity.name} width={700} height={500} style={{ width: '100%', height: '500px', objectFit: 'cover' }} priority />
                            {activity.discountPrice && (
                                <div className="discount-badge">%{Math.round((1 - activity.discountPrice / activity.price) * 100)} İndirim</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
