'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function HomeContent({ activities, settings }) {
    const { language, t } = useLanguage();
    const siteName = settings?.siteName || 'GoSkyTurkey';
    const phone = settings?.phone || '+90 555 123 4567';

    // Trust badges - veritabanından çevirilerle
    const trustBadges = [
        { icon: '🏆', value: 'TÜRSAB', textKey: 'trustBadge.licensed.text' },
        { icon: '📅', value: '10+', textKey: 'trustBadge.experience.text' },
        { icon: '👥', value: '5000+', textKey: 'trustBadge.guests.text' },
        { icon: '⭐', value: '4.9', textKey: 'trustBadge.rating.text' },
    ];

    // Why us items - veritabanından
    const whyUsKeys = ['whyUs.item1', 'whyUs.item2', 'whyUs.item3', 'whyUs.item4', 'whyUs.item5', 'whyUs.item6'];

    // Stepper items - veritabanından
    const stepperItems = [
        { titleKey: 'stepper.step1.title', descKey: 'stepper.step1.desc' },
        { titleKey: 'stepper.step2.title', descKey: 'stepper.step2.desc' },
        { titleKey: 'stepper.step3.title', descKey: 'stepper.step3.desc' },
        { titleKey: 'stepper.step4.title', descKey: 'stepper.step4.desc' },
    ];

    // Testimonials - bunlar daha sonra veritabanından çekilebilir
    const testimonials = [
        { name: 'Ahmet Y.', location: 'İstanbul', text: 'Hayatımın en güzel deneyimiydi!', rating: 5 },
        { name: 'John D.', location: 'London', text: 'Best experience of my life!', rating: 5 },
        { name: 'Hans M.', location: 'München', text: 'Das beste Erlebnis meines Lebens!', rating: 5 },
    ];

    return (
        <>
            {/* HERO */}
            <section className="hero-section" id="home">
                <div className="hero-bg">
                    <Image
                        src={settings?.heroImage || '/images/hero-bg.webp'}
                        alt="GoSkyTurkey"
                        fill
                        priority
                        unoptimized={settings?.heroImage?.startsWith('/uploads/')}
                        style={{ objectFit: 'cover' }}
                        sizes="100vw"
                    />
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
                        <span>{t(badge.textKey)}</span>
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
                        // i18n alanları destekle (name.tr, name.en veya name_en formatları)
                        const activityName = typeof activity.name === 'object'
                            ? (activity.name[language] || activity.name.tr || activity.name.en)
                            : (language === 'en' && activity.name_en ? activity.name_en : activity.name);

                        const activityLocation = typeof activity.location === 'object'
                            ? (activity.location[language] || activity.location.tr || activity.location.en)
                            : (language === 'en' && activity.location_en ? activity.location_en : activity.location);

                        const activityImage = activity.thumbnailImage || activity.image || activity.images?.[0] || '/images/paragliding.webp';
                        return (
                            <div key={activity._id || activity.slug} className="exp-card">
                                <div className="exp-card-image">
                                    <Image
                                        src={activityImage}
                                        alt={activityName}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
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
                                    <Link href={`/${language}/activity/${activity.slug}`} className="exp-card-btn">
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
                        <Image
                            src="/images/gyrocopter.webp"
                            alt="Why Choose Us"
                            width={500}
                            height={400}
                            style={{ objectFit: 'cover', borderRadius: '16px' }}
                            sizes="(max-width: 768px) 100vw, 500px"
                        />
                    </div>
                    <div className="why-content">
                        <h2>{t('sections.whyUs')}</h2>
                        <ul className="why-list">
                            {whyUsKeys.map((key, i) => <li key={i}>{t(key)}</li>)}
                        </ul>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials-section">
                <div className="section-header">
                    <h2 className="section-title">{t('sections.testimonials')}</h2>
                    <p className="section-subtitle">{t('testimonials.subtitle')}</p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((item, i) => (
                        <div key={i} className="testimonial-card">
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">{item.name.charAt(0)}</div>
                                <div className="testimonial-info">
                                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{item.name}</h3>
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
                    <h2 className="section-title">{t('sections.howItWorks')}</h2>
                    <p className="section-subtitle">{t('stepper.subtitle')}</p>
                </div>
                <div className="stepper-grid">
                    {stepperItems.map((step, i) => (
                        <div key={i} className="step-item">
                            <div className="step-number">{i + 1}</div>
                            <h3 style={{ fontSize: '1.1rem' }}>{t(step.titleKey)}</h3>
                            <p>{t(step.descKey)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CONTACT & MAP */}
            <section className="contact-section" id="contact" style={{ padding: '80px 48px', background: '#fff' }}>
                <div className="section-header">
                    <h2 className="section-title">{t('sections.contact')}</h2>
                    <p className="section-subtitle">{t('contact.visitUs')}</p>
                </div>
                <div className="contact-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="contact-map-wrapper" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <iframe
                            src={settings?.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3147.5511765354277!2d29.115456176140864!3d37.91755220392208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c713db87fa1fc9%3A0x9171b885b2b42a3c!2sGoSkyTurkey!5e0!3m2!1str!2str!4v1767648166200!5m2!1str!2str"}
                            title="GoSkyTurkey Location Map"
                            width="100%"
                            height="450"
                            style={{ border: 0, display: 'block' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                    <div className="contact-details" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                            <h3 style={{ color: '#1a2744', marginBottom: '0.5rem', fontSize: '1rem' }}>{t('contact.address')}</h3>
                            <p style={{ color: '#6c757d', maxWidth: '300px' }}>
                                {typeof settings?.address === 'object'
                                    ? (settings.address[language] || settings.address.tr || 'Pamukkale, Denizli, Türkiye')
                                    : (settings?.address || 'Pamukkale, Denizli, Türkiye')}
                            </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                            <h3 style={{ color: '#1a2744', marginBottom: '0.5rem', fontSize: '1rem' }}>{t('contact.phone')}</h3>
                            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: '#e8793a', textDecoration: 'none', fontWeight: 'bold' }}>{phone}</a>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✉️</div>
                            <h3 style={{ color: '#1a2744', marginBottom: '0.5rem', fontSize: '1rem' }}>E-mail</h3>
                            <a href={`mailto:${settings?.contactEmail || 'info@goskyturkey.com'}`} style={{ color: '#e8793a', textDecoration: 'none', fontWeight: 'bold' }}>
                                {settings?.contactEmail || 'info@goskyturkey.com'}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
