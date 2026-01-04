'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState({
        siteName: '',
        phone: '',
        email: '',
        whatsapp: '',
        address: ''
    });
    const [saving, setSaving] = useState(false);
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
                setMessage('Ayarlar kaydedildi!');
            } else {
                setMessage('Hata oluştu');
            }
        } catch (error) {
            setMessage('Bağlantı hatası');
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
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/settings" className="active">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div className="admin-card">
                <h2>Site Ayarları</h2>

                {message && (
                    <div style={{
                        padding: '0.75rem',
                        background: message.includes('kaydedildi') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        margin: '1rem 0',
                        color: message.includes('kaydedildi') ? '#22c55e' : '#ef4444'
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
                                value={settings.email || ''}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
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
                        <label>Adres</label>
                        <textarea
                            className="admin-input"
                            rows={3}
                            value={settings.address || ''}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="admin-btn" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
