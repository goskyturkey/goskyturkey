'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        paidRevenue: 0,
        confirmedRevenue: 0,
        totalRevenue: 0,
        totalActivities: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchRecentBookings();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/bookings/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setStats(result.data || result);
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
        }
    };

    const fetchRecentBookings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/bookings/admin?limit=5', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setRecentBookings(result.data?.slice(0, 5) || []);
            }
        } catch (error) {
            console.error('Recent bookings fetch error:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        const classes = {
            pending: 'pending',
            confirmed: 'confirmed',
            cancelled: 'cancelled',
            paid: 'paid'
        };
        return classes[status] || '';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Bekliyor',
            confirmed: 'Onaylandı',
            cancelled: 'İptal',
            paid: 'Ödendi'
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="empty-state">
                    <div className="empty-state__icon">⏳</div>
                    <div className="empty-state__title">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="admin-container">
            {/* Header */}
            <header className="admin-header">
                <div>
                    <h1>📊 Dashboard</h1>
                    <p>GoSkyTurkey yönetim paneline hoş geldiniz</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="admin-grid">
                <div className="stat-card">
                    <div className="stat-card__icon">📅</div>
                    <div className="stat-card__value">{stats.totalBookings}</div>
                    <div className="stat-card__label">Toplam Rezervasyon</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon">⏳</div>
                    <div className="stat-card__value">{stats.pendingBookings}</div>
                    <div className="stat-card__label">Bekleyen</div>
                    {stats.pendingBookings > 0 && (
                        <div className="stat-card__trend stat-card__trend--up">
                            ⚠️ Aksiyon gerekli
                        </div>
                    )}
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon">✅</div>
                    <div className="stat-card__value">{stats.confirmedBookings}</div>
                    <div className="stat-card__label">Onaylanan</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon">❌</div>
                    <div className="stat-card__value">{stats.cancelledBookings}</div>
                    <div className="stat-card__label">İptal Edilen</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon">💰</div>
                    <div className="stat-card__value">{(stats.paidRevenue || 0).toLocaleString()} ₺</div>
                    <div className="stat-card__label">Ödenen Gelir</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon">🎈</div>
                    <div className="stat-card__value">{stats.totalActivities}</div>
                    <div className="stat-card__label">Aktif Tur</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>⚡ Hızlı Erişim</h3>
                <div className="quick-actions">
                    <Link href="/admin/activities/new" className="quick-action-card">
                        <div className="quick-action-card__icon">➕</div>
                        <div className="quick-action-card__label">Yeni Tur Ekle</div>
                    </Link>
                    <Link href="/admin/bookings" className="quick-action-card">
                        <div className="quick-action-card__icon">📋</div>
                        <div className="quick-action-card__label">Rezervasyonlar</div>
                    </Link>
                    <Link href="/admin/gallery" className="quick-action-card">
                        <div className="quick-action-card__icon">🖼️</div>
                        <div className="quick-action-card__label">Galeri</div>
                    </Link>
                    <Link href="/admin/settings" className="quick-action-card">
                        <div className="quick-action-card__icon">⚙️</div>
                        <div className="quick-action-card__label">Ayarlar</div>
                    </Link>
                    <Link href="/admin/translations" className="quick-action-card">
                        <div className="quick-action-card__icon">🌐</div>
                        <div className="quick-action-card__label">Çeviriler</div>
                    </Link>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>📅 Son Rezervasyonlar</h3>
                    <Link href="/admin/bookings" className="admin-btn secondary small">
                        Tümünü Gör →
                    </Link>
                </div>

                {recentBookings.length > 0 ? (
                    <div className="admin-table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Müşteri</th>
                                    <th>Tur</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBookings.map((booking) => (
                                    <tr key={booking._id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{booking.customerName}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{booking.customerEmail}</div>
                                        </td>
                                        <td>{booking.activity?.name?.tr || booking.activityName || '-'}</td>
                                        <td>{formatDate(booking.date)}</td>
                                        <td style={{ fontWeight: 600 }}>{booking.totalPrice?.toLocaleString()} ₺</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                                {getStatusText(booking.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state__icon">📭</div>
                        <div className="empty-state__title">Henüz rezervasyon yok</div>
                        <div className="empty-state__text">İlk rezervasyonunuz burada görünecek</div>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="admin-alert info" style={{ marginTop: '1.5rem' }}>
                <span>💡</span>
                <div>
                    <strong>İpucu:</strong> Sol menüden tüm site içeriğini yönetebilirsiniz.
                    Çeviriler sayfasından site metinlerini farklı dillerde düzenleyebilirsiniz.
                </div>
            </div>
        </div>
    );
}
