'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { value: 'paragliding', label: 'Yamaç Paraşütü' },
    { value: 'gyrocopter', label: 'Gyrocopter' },
    { value: 'balloon', label: 'Balon' }
];

export default function NewActivityPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        shortDescription: '',
        category: 'paragliding',
        price: '',
        discountPrice: '',
        duration: '',
        location: '',
        meetingPoint: '',
        includes: '',
        excludes: '',
        maxParticipants: 10,
        isActive: true,
        isFeatured: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                ...formData,
                price: parseInt(formData.price),
                discountPrice: formData.discountPrice ? parseInt(formData.discountPrice) : null,
                maxParticipants: parseInt(formData.maxParticipants),
                includes: formData.includes.split(',').map(s => s.trim()).filter(Boolean),
                excludes: formData.excludes.split(',').map(s => s.trim()).filter(Boolean)
            };

            const res = await fetch('/api/activities/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/admin/activities');
            } else {
                const result = await res.json();
                setError(result.message || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Kaydetme sırasında hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>➕ Yeni Aktivite</h1>
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities" className="active">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div className="admin-card">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aktivite Adı *</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori *</label>
                            <select
                                className="admin-input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Fiyat (₺) *</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>İndirimli Fiyat (₺)</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.discountPrice}
                                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Süre</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="30-40 dakika"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Konum *</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="Fethiye, Ölüdeniz"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Buluşma Noktası</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.meetingPoint}
                                onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Maksimum Katılımcı</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kısa Açıklama</label>
                        <input
                            type="text"
                            className="admin-input"
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Detaylı Açıklama</label>
                        <textarea
                            className="admin-input"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Dahil Olanlar (virgülle ayır)</label>
                            <textarea
                                className="admin-input"
                                rows={3}
                                placeholder="Profesyonel pilot, Ekipman, Sigorta, Video"
                                value={formData.includes}
                                onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Dahil Olmayanlar (virgülle ayır)</label>
                            <textarea
                                className="admin-input"
                                rows={3}
                                placeholder="Ulaşım, Yemek"
                                value={formData.excludes}
                                onChange={(e) => setFormData({ ...formData, excludes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            Aktif
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            />
                            Öne Çıkan
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="admin-btn" disabled={saving}>
                            {saving ? 'Kaydediliyor...' : 'Aktivite Ekle'}
                        </button>
                        <Link href="/admin/activities" className="admin-btn secondary">
                            İptal
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
