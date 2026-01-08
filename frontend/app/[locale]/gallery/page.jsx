'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export default function GalleryPage() {
    const { language, t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    // Default static images as fallback
    const defaultImages = [
        { title: 'Fethiye Yamaç Paraşütü', title_en: 'Fethiye Paragliding', imageUrl: '/images/paragliding.webp' },
        { title: 'Pamukkale Gyrocopter Turu', title_en: 'Pamukkale Gyrocopter Tour', imageUrl: '/images/gyrocopter.webp' },
        { title: 'Pamukkale Balon Turu', title_en: 'Pamukkale Balloon Tour', imageUrl: '/images/balloon.webp' },
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
        if (typeof item.title === 'object') {
            return language === 'en' ? (item.title.en || item.title.tr) : (item.title.tr || item.title.en);
        }
        if (language === 'en' && item.title_en) {
            return item.title_en;
        }
        return item.title;
    };

    const getDescription = (item) => {
        if (typeof item.description === 'object') {
            return language === 'en' ? (item.description.en || item.description.tr) : (item.description.tr || item.description.en);
        }
        return item.description || '';
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setSelectedImage(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

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
                        onClick={() => setSelectedImage(item)}
                        style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <img
                            src={item.imageUrl || item.src}
                            alt={getTitle(item)}
                            style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{getTitle(item)}</h3>
                            {item.tags && item.tags.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {item.tags.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} style={{
                                            fontSize: '0.75rem',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            opacity: 0.9
                                        }}>#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                    <p>{t('gallery.noItems')}</p>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'zoom-out',
                        padding: '2rem'
                    }}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                    <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}>
                        <img
                            src={selectedImage.imageUrl || selectedImage.src}
                            alt={getTitle(selectedImage)}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
                        <div style={{ marginTop: '1rem', color: 'white' }}>
                            <h2 style={{ margin: '0 0 0.5rem 0' }}>{getTitle(selectedImage)}</h2>
                            {getDescription(selectedImage) && (
                                <p style={{ opacity: 0.7, margin: 0 }}>{getDescription(selectedImage)}</p>
                            )}
                            {selectedImage.tags && selectedImage.tags.length > 0 && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                                    {selectedImage.tags.map((tag, idx) => (
                                        <span key={idx} style={{
                                            fontSize: '0.85rem',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            padding: '4px 12px',
                                            borderRadius: '15px'
                                        }}>#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
