import JsonLd from '@/components/JsonLd';
import { DEFAULT_ACTIVITIES_MAP } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import './activity.css';

const defaultActivities = DEFAULT_ACTIVITIES_MAP;

// UI çevirileri - 6 dil desteği
const uiTranslations = {
    tr: {
        backToTours: '← Tüm Turlar',
        paragliding: '🪂 Yamaç Paraşütü',
        gyrocopter: '🚁 Gyrocopter',
        balloon: '🎈 Balon Turu',
        maxParticipants: 'Maks {count} kişi',
        videoIncluded: 'Video çekim dahil',
        description: 'Açıklama',
        included: '✅ Dahil Olanlar',
        excluded: '❌ Dahil Olmayanlar',
        perPerson: '/ kişi',
        bookNow: 'Rezervasyon Yap',
        discount: '%{percent} İndirim',
        home: 'Ana Sayfa'
    },
    en: {
        backToTours: '← All Tours',
        paragliding: '🪂 Paragliding',
        gyrocopter: '🚁 Gyrocopter',
        balloon: '🎈 Balloon Tour',
        maxParticipants: 'Max {count} guests',
        videoIncluded: 'Video included',
        description: 'Description',
        included: '✅ Included',
        excluded: '❌ Not Included',
        perPerson: '/ person',
        bookNow: 'Book Now',
        discount: '{percent}% Off',
        home: 'Home'
    },
    de: {
        backToTours: '← Alle Touren',
        paragliding: '🪂 Paragliding',
        gyrocopter: '🚁 Gyrocopter',
        balloon: '🎈 Ballonfahrt',
        maxParticipants: 'Max {count} Gäste',
        videoIncluded: 'Video inklusive',
        description: 'Beschreibung',
        included: '✅ Inklusive',
        excluded: '❌ Nicht Inklusive',
        perPerson: '/ Person',
        bookNow: 'Jetzt Buchen',
        discount: '{percent}% Rabatt',
        home: 'Startseite'
    },
    fr: {
        backToTours: '← Toutes les excursions',
        paragliding: '🪂 Parapente',
        gyrocopter: '🚁 Gyrocoptère',
        balloon: '🎈 Vol en montgolfière',
        maxParticipants: 'Max {count} personnes',
        videoIncluded: 'Vidéo incluse',
        description: 'Description',
        included: '✅ Inclus',
        excluded: '❌ Non Inclus',
        perPerson: '/ personne',
        bookNow: 'Réserver',
        discount: '{percent}% de réduction',
        home: 'Accueil'
    },
    hi: {
        backToTours: '← सभी टूर',
        paragliding: '🪂 पैराग्लाइडिंग',
        gyrocopter: '🚁 जाइरोकॉप्टर',
        balloon: '🎈 बैलून टूर',
        maxParticipants: 'अधिकतम {count} मेहमान',
        videoIncluded: 'वीडियो शामिल',
        description: 'विवरण',
        included: '✅ शामिल',
        excluded: '❌ शामिल नहीं',
        perPerson: '/ व्यक्ति',
        bookNow: 'अभी बुक करें',
        discount: '{percent}% छूट',
        home: 'होम'
    },
    zh: {
        backToTours: '← 所有行程',
        paragliding: '🪂 滑翔伞',
        gyrocopter: '🚁 旋翼机',
        balloon: '🎈 热气球之旅',
        maxParticipants: '最多 {count} 位客人',
        videoIncluded: '包含视频',
        description: '描述',
        included: '✅ 包含',
        excluded: '❌ 不包含',
        perPerson: '/ 每人',
        bookNow: '立即预订',
        discount: '{percent}% 折扣',
        home: '首页'
    }
};

async function getActivity(slug, locale = 'tr') {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/activities/${slug}?lang=${locale}`, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Not found');
        const result = await res.json();
        return result.data || result;
    } catch (error) {
        return defaultActivities[slug] || null;
    }
}

export async function generateMetadata({ params }) {
    const { slug, locale } = await params;
    const activity = await getActivity(slug, locale);
    if (!activity) return { title: 'Aktivite Bulunamadı' };

    // API zaten lokalize edilmiş veri döndürüyor
    const name = activity.name || '';
    const description = activity.description || '';

    return {
        title: name,
        description: description,
        alternates: {
            canonical: `https://goskyturkey.com/${locale}/activity/${slug}`,
        },
        openGraph: {
            title: `${name} | GoSkyTurkey`,
            description: description,
            images: [activity.image]
        },
    };
}

export default async function ActivityPage({ params }) {
    const { slug, locale } = await params;
    const activity = await getActivity(slug, locale);
    if (!activity) notFound();

    const t = uiTranslations[locale] || uiTranslations.tr;

    // API zaten lokalize edilmiş veri döndürüyor
    const name = activity.name || '';
    const description = activity.description || '';
    const location = activity.location || '';
    const duration = activity.duration || '';
    const includes = activity.includes || [];
    const excludes = activity.excludes || [];

    const features = [
        { icon: '⏱️', text: duration },
        { icon: '📍', text: location },
        { icon: '👥', text: t.maxParticipants.replace('{count}', activity.maxParticipants || activity.maxGuests || 10) },
        { icon: '🎥', text: t.videoIncluded }
    ];

    const coverImage = activity.thumbnailImage || activity.image || activity.images?.[0] || '/images/paragliding.webp';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: name,
        image: coverImage,
        description: description,
        offers: {
            '@type': 'Offer',
            url: `https://goskyturkey.com/${locale}/activity/${slug}`,
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
                name: locale === 'tr' ? 'Ana Sayfa' : 'Home',
                item: 'https://goskyturkey.com'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: name,
                item: `https://goskyturkey.com/${locale}/activity/${slug}`
            }
        ]
    };

    const getCategoryLabel = () => {
        if (activity.category === 'paragliding') return t.paragliding;
        if (activity.category === 'gyrocopter') return t.gyrocopter;
        if (activity.category === 'balloon') return t.balloon;
        return '';
    };

    const discountPercent = activity.discountPrice
        ? Math.round((1 - activity.discountPrice / activity.price) * 100)
        : 0;

    return (
        <div className="activity-detail-page page-container">
            <JsonLd data={schema} />
            <JsonLd data={breadcrumbSchema} />

            <main className="detail-main">
                {/* Back Link */}
                <div className="back-link-wrapper">
                    <Link href={`/${locale}`} className="back-link">{t.backToTours}</Link>
                </div>

                {/* Two Column Layout */}
                <div className="detail-container">
                    {/* Left: Info Section */}
                    <div className="detail-info">
                        <div className="category-tag">
                            {getCategoryLabel()}
                        </div>

                        <h1 className="detail-title">{name}</h1>

                        <div className="detail-features">
                            {features.map((f, i) => (
                                <div key={i} className="feature-item">
                                    <span className="feature-icon">{f.icon}</span>
                                    <span>{f.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="detail-description">
                            <h2>{t.description}</h2>
                            <p>{description}</p>
                        </div>

                        <div className="detail-includes">
                            <div className="includes-section">
                                <h3>{t.included}</h3>
                                <ul>{includes.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </div>
                            <div className="excludes-section">
                                <h3>{t.excluded}</h3>
                                <ul>{excludes.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </div>
                        </div>

                        {/* Important Note - sadece varsa göster */}
                        {activity.importantNote && (
                            <div className="important-note" style={{
                                background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)',
                                border: '1px solid #ffc107',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                marginTop: '20px',
                                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
                            }}>
                                <p style={{ margin: 0, color: '#856404', lineHeight: 1.6 }}>
                                    {activity.importantNote}
                                </p>
                            </div>
                        )}

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
                                <span className="price-per">{t.perPerson}</span>
                            </div>
                            <Link href={`/${locale}/booking/${activity.slug}`} className="cta-button">{t.bookNow}</Link>
                        </div>
                    </div>

                    {/* Right: Gallery */}
                    <div className="detail-gallery">
                        <div className="main-image">
                            <Image src={coverImage} alt={name} width={700} height={500} style={{ width: '100%', height: '500px', objectFit: 'cover' }} priority />
                            {activity.discountPrice && (
                                <div className="discount-badge">
                                    {t.discount.replace('{percent}', discountPercent)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
