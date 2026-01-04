'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminActivitiesPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchActivities();
        }
    }, [user]);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/activities/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setActivities(result.data || result);
            }
        } catch (error) {
            console.error('Activities fetch error:', error);
        }
    };

    const toggleActive = async (activity) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/activities/admin/${activity._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !activity.isActive })
            });
            fetchActivities();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/activities/admin/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchActivities();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>🎯 Aktiviteler</h1>
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities" className="active">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div style={{ marginBottom: '1rem' }}>
                <Link href="/admin/activities/new" className="admin-btn">
                    + Yeni Aktivite Ekle
                </Link>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Aktivite</th>
                            <th>Konum</th>
                            <th>Fiyat</th>
                            <th>İndirimli</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((activity) => (
                            <tr key={activity._id}>
                                <td>{activity.name}</td>
                                <td>{activity.location}</td>
                                <td>{activity.price?.toLocaleString()} ₺</td>
                                <td>{activity.discountPrice ? `${activity.discountPrice.toLocaleString()} ₺` : '-'}</td>
                                <td>
                                    <button
                                        onClick={() => toggleActive(activity)}
                                        className={`status-badge ${activity.isActive ? 'confirmed' : 'cancelled'}`}
                                        style={{ cursor: 'pointer', border: 'none' }}
                                    >
                                        {activity.isActive ? 'Aktif' : 'Pasif'}
                                    </button>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link
                                            href={`/admin/activities/edit?id=${activity._id}`}
                                            className="admin-btn secondary"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                                        >
                                            ✏️ Düzenle
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(activity._id)}
                                            className="admin-btn secondary"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)' }}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
