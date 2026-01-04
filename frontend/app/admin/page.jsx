'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        totalActivities: 0
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
        }
    };

    if (loading) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>📊 Admin Panel</h1>
                <nav className="admin-nav">
                    <Link href="/admin" className="active">Dashboard</Link>
                    <Link href="/admin/activities">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div className="admin-grid">
                <div className="stat-card">
                    <h3>{stats.totalBookings}</h3>
                    <p>Toplam Rezervasyon</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.pendingBookings}</h3>
                    <p>Bekleyen</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.totalRevenue?.toLocaleString()} ₺</h3>
                    <p>Toplam Gelir</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.totalActivities}</h3>
                    <p>Aktivite</p>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: '2rem' }}>
                <h2>Hoş Geldiniz!</h2>
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                    GoSky Turkey yönetim paneline hoş geldiniz. Sol menüden işlemlerinizi yapabilirsiniz.
                </p>
            </div>
        </div>
    );
}
