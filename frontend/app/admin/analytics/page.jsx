'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminAnalyticsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        pageViews: { today: 0, week: 0, month: 0 },
        bookings: { today: 0, week: 0, month: 0 },
        revenue: { today: 0, week: 0, month: 0 },
        topActivities: []
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
        }
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>📈 Analytics</h1>
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/analytics" className="active">Analytics</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div className="admin-grid">
                <div className="stat-card">
                    <h4>Bugün</h4>
                    <h3>{stats.bookings?.today || 0}</h3>
                    <p>Rezervasyon</p>
                </div>
                <div className="stat-card">
                    <h4>Bu Hafta</h4>
                    <h3>{stats.bookings?.week || 0}</h3>
                    <p>Rezervasyon</p>
                </div>
                <div className="stat-card">
                    <h4>Bu Ay</h4>
                    <h3>{stats.bookings?.month || 0}</h3>
                    <p>Rezervasyon</p>
                </div>
                <div className="stat-card">
                    <h4>Toplam Gelir</h4>
                    <h3>{(stats.revenue?.month || 0).toLocaleString()} ₺</h3>
                    <p>Bu Ay</p>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: '2rem' }}>
                <h2>📊 Google Analytics</h2>
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                    Detaylı trafik analizi için{' '}
                    <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>
                        Google Analytics Dashboard
                    </a>
                    {' '}ziyaret edin.
                </p>
                <p style={{ opacity: 0.5, marginTop: '1rem', fontSize: '0.9rem' }}>
                    Tracking ID: G-81MZL78LTY
                </p>
            </div>

            <div className="admin-card" style={{ marginTop: '1rem' }}>
                <h2>🔝 Popüler Aktiviteler</h2>
                <div style={{ marginTop: '1rem' }}>
                    {stats.topActivities?.length > 0 ? (
                        stats.topActivities.map((activity, i) => (
                            <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <strong>{i + 1}. {activity.name}</strong>
                                <span style={{ float: 'right', opacity: 0.7 }}>{activity.bookings} rezervasyon</span>
                            </div>
                        ))
                    ) : (
                        <p style={{ opacity: 0.5 }}>Henüz veri yok</p>
                    )}
                </div>
            </div>
        </div>
    );
}
