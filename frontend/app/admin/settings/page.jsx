'use client';

import { I18nInput } from '@/components/admin/FormElements';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function AdminSettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef(null);
    const [settings, setSettings] = useState({
        siteName: '',
        phone: '',
        contactEmail: '',
        whatsapp: '',
        mapEmbedUrl: '',
        address: { tr: '', en: '', de: '', fr: '', hi: '', zh: '' },
        heroImage: ''
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const result = await res.json();
                const data = result.data || result;
                setSettings(data);
            }
        } catch (error) {
            console.error('Settings fetch error:', error);
        }
    };

    const handleHeroUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload/hero', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                setSettings({ ...settings, heroImage: result.data.url });
                setMessage(`✅ Görsel yüklendi ve WebP'ye dönüştürüldü! (${(result.data.size / 1024).toFixed(0)} KB)`);
            } else {
                setMessage('❌ Görsel yüklenemedi');
            }
        } catch (error) {
            console.error('Hero upload error:', error);
            setMessage('❌ Bağlantı hatası');
        }
        setUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/settings/admin', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage('✅ Ayarlar kaydedildi!');
            } else {
                setMessage('❌ Hata oluştu');
            }
        } catch (error) {
            setMessage('❌ Bağlantı hatası');
        }
        setSaving(false);
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>⚙️ Ayarlar</h1>
            </header>

            <div className="admin-card">
                <h2>🖼️ Hero Görseli</h2>
                <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Ana sayfa arka plan görseli. PNG/JPG yüklesen bile otomatik WebP'ye dönüştürülür.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '300px',
                        height: '180px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#1e293b',
                        position: 'relative'
                    }}>
                        {settings.heroImage ? (
                            <Image
                                src={settings.heroImage?.startsWith('/') ? settings.heroImage : `/${settings.heroImage}`}
                                alt="Hero"
                                fill
                                unoptimized
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#64748b'
                            }}>
                                Görsel yüklenmemiş
                            </div>
                        )}
                    </div>

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleHeroUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="admin-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{ marginBottom: '0.5rem' }}
                        >
                            {uploading ? '⏳ Yükleniyor...' : '📤 Görsel Yükle'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Önerilen: 2560x1440 px<br />
                            Max: 20 MB<br />
                            Format: PNG, JPG, WebP
                        </p>
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                <h2>Site Ayarları</h2>

                {message && (
                    <div style={{
                        padding: '0.75rem',
                        background: message.includes('✅') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        margin: '1rem 0',
                        color: message.includes('✅') ? '#22c55e' : '#ef4444'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Site Adı</label>
                            <input
                                className="admin-input"
                                value={settings.siteName || ''}
                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Telefon</label>
                            <input
                                className="admin-input"
                                value={settings.phone || ''}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Email</label>
                            <input
                                className="admin-input"
                                type="email"
                                value={settings.contactEmail || ''}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>WhatsApp</label>
                            <input
                                className="admin-input"
                                value={settings.whatsapp || ''}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <label>Harita Embed Linki (Google Maps iframe src)</label>
                        <input
                            className="admin-input"
                            value={settings.mapEmbedUrl || ''}
                            onChange={(e) => setSettings({ ...settings, mapEmbedUrl: e.target.value })}
                            placeholder="https://www.google.com/maps/embed?..."
                        />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <I18nInput
                            label="Adres"
                            value={settings.address || {}}
                            onChange={(val) => setSettings({ ...settings, address: val })}
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="admin-btn" disabled={saving} style={{ marginTop: '1.5rem' }}>
                        {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
