'use client';

import { I18nArrayInput, I18nInput } from '@/components/admin/FormElements';
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
    const { user, loading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: {},
        description: {},
        shortDescription: {},
        category: 'paragliding',
        price: '',
        discountPrice: '',
        duration: {},
        location: {},
        meetingPoint: {},
        includes: [],
        excludes: [],
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

        // Basic validation - check if at least one name is present (usually TR)
        // Or check dynamic required fields. Backend will validate strict rules.
        if (!formData.name || Object.keys(formData.name).length === 0) {
            // This validation is weak on client side now, relying on backend or component required prop
            // But component required prop only shows asterisk, doesn't block submit for non-native inputs perfectly unless integrated.
            // Let's assume backend validation is primary.
        }

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                ...formData,
                price: parseInt(formData.price),
                discountPrice: formData.discountPrice ? parseInt(formData.discountPrice) : null,
                maxParticipants: parseInt(formData.maxParticipants)
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
            </header>

            <div className="admin-card">
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <strong>🌍 Çoklu Dil Desteği:</strong> Sistemde tanımlı tüm diller için sekmeler otomatik oluşturulur. Kırmızı yıldızlı diller (*) zorunludur.
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    <I18nInput
                        label="Aktivite Adı"
                        value={formData.name}
                        onChange={(val) => setFormData({ ...formData, name: val })}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Maksimum Katılımcı</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                            />
                        </div>
                    </div>

                    <I18nInput
                        label="Kısa Açıklama"
                        value={formData.shortDescription}
                        onChange={(val) => setFormData({ ...formData, shortDescription: val })}
                    />

                    <I18nInput
                        label="Detaylı Açıklama"
                        value={formData.description}
                        onChange={(val) => setFormData({ ...formData, description: val })}
                        rows={4}
                    />

                    <I18nInput
                        label="Süre"
                        value={formData.duration}
                        onChange={(val) => setFormData({ ...formData, duration: val })}
                        placeholder="30-40 dakika / 30-40 minutes"
                    />

                    <I18nInput
                        label="Konum"
                        value={formData.location}
                        onChange={(val) => setFormData({ ...formData, location: val })}
                        required
                    />

                    <I18nInput
                        label="Buluşma Noktası"
                        value={formData.meetingPoint}
                        onChange={(val) => setFormData({ ...formData, meetingPoint: val })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <I18nArrayInput
                            label="Dahil Olanlar"
                            value={formData.includes}
                            onChange={(val) => setFormData({ ...formData, includes: val })}
                            placeholder="Profesyonel pilot, Ekipman, Sigorta"
                        />

                        <I18nArrayInput
                            label="Dahil Olmayanlar"
                            value={formData.excludes}
                            onChange={(val) => setFormData({ ...formData, excludes: val })}
                            placeholder="Ulaşım, Yemek"
                        />
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
