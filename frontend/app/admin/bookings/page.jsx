'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminBookingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/bookings/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setBookings(result.data || []);
            }
        } catch (error) {
            console.error('Bookings fetch error:', error);
        }
    };

    const updateStatus = async (bookingId, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/bookings/admin/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            fetchBookings();
        } catch (error) {
            console.error('Status update error:', error);
        }
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>📋 Rezervasyonlar</h1>
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities">Aktiviteler</Link>
                    <Link href="/admin/bookings" className="active">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Müşteri</th>
                            <th>Aktivite</th>
                            <th>Tarih</th>
                            <th>Kişi</th>
                            <th>Tutar</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking._id}>
                                <td>
                                    <strong>{booking.customerName || booking.customerInfo?.name}</strong>
                                    <br />
                                    <small style={{ opacity: 0.7 }}>{booking.customerEmail || booking.customerInfo?.email}</small>
                                </td>
                                <td>{booking.activity?.name || 'N/A'}</td>
                                <td>{new Date(booking.date).toLocaleDateString('tr-TR')}</td>
                                <td>{booking.participants || booking.guests}</td>
                                <td>{booking.totalPrice?.toLocaleString()} ₺</td>
                                <td>
                                    <span className={`status-badge ${booking.status}`}>
                                        {booking.status === 'pending' && 'Bekliyor'}
                                        {booking.status === 'confirmed' && 'Onaylandı'}
                                        {booking.status === 'cancelled' && 'İptal'}
                                        {booking.status === 'completed' && 'Tamamlandı'}
                                    </span>
                                </td>
                                <td>
                                    {booking.status === 'pending' && (
                                        <>
                                            <button
                                                className="admin-btn"
                                                style={{ marginRight: '0.5rem' }}
                                                onClick={() => updateStatus(booking._id, 'confirmed')}
                                            >
                                                Onayla
                                            </button>
                                            <button
                                                className="admin-btn secondary"
                                                onClick={() => updateStatus(booking._id, 'cancelled')}
                                            >
                                                İptal
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
