'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function HomeContent({ activities, settings }) {
    const { language, t } = useLanguage();
    const siteName = settings?.siteName || 'GoSky Turkey';
    const phone = settings?.phone || '+90 555 123 4567';

    const trustBadges = language === 'tr' ? [
        { icon: '🏆', value: 'TÜRSAB', text: 'Lisanslı' },
        { icon: '📅', value: '10+', text: 'Yıl Deneyim' },
        { icon: '👥', value: '5000+', text: 'Mutlu Misafir' },
        { icon: '⭐', value: '4.9', text: 'Ortalama Puan' },
    ] : [
        { icon: '🏆', value: 'TÜRSAB', text: 'Licensed' },
        { icon: '📅', value: '10+', text: 'Years Experience' },
        { icon: '👥', value: '5000+', text: 'Happy Guests' },
        { icon: '⭐', value: '4.9', text: 'Average Rating' },
    ];

    const whyUsItems = language === 'tr' ? [
        '✓ TÜRSAB lisanslı, yasal ve güvenilir operatör',
        '✓ 10+ yıllık deneyimli profesyonel pilot kadrosu',
        '✓ Uluslararası standartlarda ekipman ve güvenlik',
        '✓ Ücretsiz profesyonel video ve fotoğraf çekimi',
        '✓ Esnek ödeme seçenekleri ve kolay rezervasyon',
        '✓ 7/24 müşteri desteği ve WhatsApp iletişim',
    ] : [
        '✓ TÜRSAB licensed, legal and reliable operator',
        '✓ 10+ years experienced professional pilot team',
        '✓ International standard equipment and safety',
        '✓ Free professional video and photo shooting',
        '✓ Flexible payment options and easy booking',
        '✓ 24/7 customer support and WhatsApp contact',
    ];

    const testimonials = language === 'tr' ? [
        { name: 'Ahmet Y.', location: 'İstanbul', text: 'Hayatımın en güzel deneyimiydi! Pilot çok profesyoneldi, manzara muhteşemdi.', rating: 5 },
        { name: 'Merve K.', location: 'Ankara', text: 'Balon turu için geldik ama yamaç paraşütünü de denedik. Her ikisi de mükemmeldi!', rating: 5 },
        { name: 'Can B.', location: 'İzmir', text: 'Gyrocopter deneyimi beklentilerimin çok üzerindeydi. Fotoğraflar da hediye!', rating: 5 },
    ] : [
        { name: 'John D.', location: 'London', text: 'Best experience of my life! The pilot was very professional and the view was amazing.', rating: 5 },
        { name: 'Sarah M.', location: 'New York', text: 'We came for the balloon tour but also tried paragliding. Both were amazing!', rating: 5 },
        { name: 'Mike R.', location: 'Berlin', text: 'The gyrocopter experience exceeded my expectations. Photos were a gift!', rating: 5 },
    ];

    const stepperItems = language === 'tr' ? [
        { title: 'Tur Seçin', description: 'Size uygun deneyimi seçin' },
        { title: 'Tarih Belirleyin', description: 'Uygun tarihi seçin' },
        { title: 'Rezervasyon', description: 'Online veya telefonla' },
        { title: 'Keyfini Çıkarın', description: 'Unutulmaz anlar yaşayın' },
    ] : [
        { title: 'Choose Tour', description: 'Pick the right experience' },
        { title: 'Select Date', description: 'Choose available date' },
        { title: 'Book Now', description: 'Online or by phone' },
        { title: 'Enjoy', description: 'Create unforgettable memories' },
    ];

    return (
        <>
            {/* HERO */}
            <section className="hero-section" id="home">
                <div className="hero-bg">
                    <Image src="/images/hero-bg.png" alt="GoSky Turkey" fill priority style={{ objectFit: 'cover' }} />
                </div>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">{t('hero.title')}</h1>
                    <p className="hero-subtitle">{t('hero.subtitle')}</p>
                    <a href="#experiences" className="hero-cta">{t('hero.cta')}</a>
                </div>
            </section>

            {/* TRUST BAND */}
            <div className="trust-band">
                {trustBadges.map((badge, i) => (
                    <div key={i} className="trust-item">
                        <span className="trust-icon">{badge.icon}</span>
                        <span className="trust-value">{badge.value}</span>
                        <span>{badge.text}</span>
                    </div>
                ))}
            </div>

            {/* EXPERIENCES */}
            <section className="experiences-section" id="experiences">
                <div className="section-header">
                    <h2 className="section-title">{t('sections.popularExperiences')}</h2>
                    <p className="section-subtitle">{t('sections.popularSubtitle')}</p>
                </div>
                <div className="experiences-grid">
                    {activities.map((activity) => {
                        const activityName = language === 'en' && activity.name_en ? activity.name_en : activity.name;
                        const activityLocation = language === 'en' && activity.location_en ? activity.location_en : activity.location;
                        const activityImage = activity.thumbnailImage || activity.image || activity.images?.[0] || '/images/paragliding.png';
                        return (
                            <div key={activity._id || activity.slug} className="exp-card">
                                <div className="exp-card-image">
                                    <Image src={activityImage} alt={activityName} fill style={{ objectFit: 'cover' }} />
                                    <div className="exp-card-overlay">
                                        <h3 className="exp-card-title">{activityName}</h3>
                                        <div className="exp-card-location">📍 {activityLocation}</div>
                                    </div>
                                </div>
                                <div className="exp-card-footer">
                                    <div className="exp-card-price">
                                        {activity.discountPrice && <span className="old">₺{activity.price?.toLocaleString()}</span>}
                                        <span className="current">₺{(activity.discountPrice || activity.price)?.toLocaleString()}</span>
                                    </div>
                                    <Link href={`/activity/${activity.slug}`} className="exp-card-btn">
                                        {t('activity.bookNow')}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* WHY US */}
            <section className="why-section" id="why">
                <div className="why-container">
                    <div className="why-image">
                        <Image src="/images/gyrocopter.png" alt="Why Choose Us" width={500} height={400} style={{ objectFit: 'cover', borderRadius: '16px' }} />
                    </div>
                    <div className="why-content">
                        <h2>{t('sections.whyUs')}</h2>
                        <ul className="why-list">
                            {whyUsItems.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials-section">
                <div className="section-header">
                    <h2 className="section-title">{language === 'tr' ? 'Müşteri Yorumları' : 'Customer Reviews'}</h2>
                    <p className="section-subtitle">{language === 'tr' ? 'Misafirlerimizin deneyimleri' : 'Experiences of our guests'}</p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((item, i) => (
                        <div key={i} className="testimonial-card">
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">{item.name.charAt(0)}</div>
                                <div className="testimonial-info">
                                    <h4>{item.name}</h4>
                                    <span>{item.location}</span>
                                </div>
                            </div>
                            <p className="testimonial-text">"{item.text}"</p>
                            <div className="testimonial-stars">{'⭐'.repeat(item.rating)}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* STEPPER */}
            <section className="stepper-section">
                <div className="section-header">
                    <h2 className="section-title">{language === 'tr' ? 'Nasıl Çalışıyor?' : 'How It Works?'}</h2>
                    <p className="section-subtitle">{language === 'tr' ? '4 kolay adımda rezervasyon' : 'Book in 4 easy steps'}</p>
                </div>
                <div className="stepper-grid">
                    {stepperItems.map((step, i) => (
                        <div key={i} className="step-item">
                            <div className="step-number">{i + 1}</div>
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
