'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export default function GalleryPage() {
    const { language, t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default static images as fallback
    const defaultImages = [
        { title: 'Fethiye Yamaç Paraşütü', title_en: 'Fethiye Paragliding', imageUrl: '/images/paragliding.png' },
        { title: 'Pamukkale Gyrocopter Turu', title_en: 'Pamukkale Gyrocopter Tour', imageUrl: '/images/gyrocopter.png' },
        { title: 'Pamukkale Balon Turu', title_en: 'Pamukkale Balloon Tour', imageUrl: '/images/balloon.png' },
    ];

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await fetch('/api/gallery');
                if (res.ok) {
                    const result = await res.json();
                    if (result.data && result.data.length > 0) {
                        setItems(result.data);
                    } else {
                        setItems(defaultImages);
                    }
                } else {
                    setItems(defaultImages);
                }
            } catch (error) {
                console.error('Gallery fetch error:', error);
                setItems(defaultImages);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const getTitle = (item) => {
        if (language === 'en' && item.title_en) {
            return item.title_en;
        }
        return item.title;
    };

    if (loading) {
        return (
            <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px', textAlign: 'center' }}>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                {t('gallery.title')}
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '3rem', opacity: 0.7 }}>
                {t('gallery.subtitle')}
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {items.map((item, index) => (
                    <div
                        key={item._id || index}
                        style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <img
                            src={item.imageUrl || item.src}
                            alt={getTitle(item)}
                            style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{getTitle(item)}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                    <p>{t('gallery.noItems')}</p>
                </div>
            )}
        </div>
    );
}
