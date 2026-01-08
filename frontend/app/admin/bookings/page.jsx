'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Helper to extract localized value from i18n object
const getLocalizedValue = (field, locale = 'tr') => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
        return field[locale] || field.tr || field.en || '';
    }
    return '';
};

export default function AdminBookingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);

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
            </header>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Müşteri</th>
                            <th>Aktivite</th>
                            <th>Tarih / Saat</th>
                            <th>Kişi</th>
                            <th>Tutar</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr
                                key={booking._id}
                                onClick={() => setSelectedBooking(booking)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <strong>{booking.customerName || booking.customerInfo?.name}</strong>
                                    <br />
                                    <small style={{ opacity: 0.7 }}>{booking.customerEmail || booking.customerInfo?.email}</small>
                                </td>
                                <td>{getLocalizedValue(booking.activity?.name) || 'N/A'}</td>
                                <td>
                                    {new Date(booking.date).toLocaleDateString('tr-TR')}
                                    <br />
                                    <small style={{ opacity: 0.7 }}>{booking.time || '-'}</small>
                                </td>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(booking._id, 'confirmed');
                                                }}
                                            >
                                                Onayla
                                            </button>
                                            <button
                                                className="admin-btn secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(booking._id, 'cancelled');
                                                }}
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

            {selectedBooking && (
                <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>Rezervasyon Detayı</h3>
                        <p><strong>Müşteri:</strong> {selectedBooking.customerName}</p>
                        <p><strong>Email:</strong> {selectedBooking.customerEmail}</p>
                        <p><strong>Telefon:</strong> {selectedBooking.customerPhone || '-'}</p>
                        <p><strong>Aktivite:</strong> {selectedBooking.activity?.name}</p>
                        <p><strong>Tarih / Saat:</strong> {new Date(selectedBooking.date).toLocaleDateString('tr-TR')} {selectedBooking.time || ''}</p>
                        <p><strong>Kişi:</strong> {selectedBooking.participants || selectedBooking.guests}</p>
                        <p><strong>Tutar:</strong> {selectedBooking.totalPrice?.toLocaleString()} ₺</p>
                        <p><strong>Durum:</strong> {selectedBooking.status}</p>
                        <p><strong>Ödeme Durumu:</strong> {selectedBooking.paymentStatus || '-'}</p>
                        <p><strong>Ödeme Yöntemi:</strong> {selectedBooking.paymentMethod || '-'}</p>
                        {selectedBooking.notes && <p><strong>Not:</strong> {selectedBooking.notes}</p>}
                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <button className="admin-btn secondary" onClick={() => setSelectedBooking(null)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
