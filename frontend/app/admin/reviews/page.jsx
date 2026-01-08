'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminReviewsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending, approved, all

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) fetchReviews();
    }, [user, filter]);

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            let url = '/api/reviews';
            if (filter === 'pending') url += '?approved=false';
            else if (filter === 'approved') url += '?approved=true';

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setReviews(result.data || []);
            }
        } catch (error) {
            console.error('Reviews fetch error:', error);
        }
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/reviews/${id}/approve`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReviews();
        } catch (error) {
            console.error('Approve error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/reviews/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReviews();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    const pendingCount = reviews.filter(r => !r.isApproved).length;
    const approvedCount = reviews.filter(r => r.isApproved).length;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>💬 Yorum Yönetimi</h1>
            </header>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    className={`admin-btn ${filter === 'pending' ? '' : 'secondary'}`}
                    onClick={() => setFilter('pending')}
                >
                    ⏳ Bekleyen ({pendingCount})
                </button>
                <button
                    className={`admin-btn ${filter === 'approved' ? '' : 'secondary'}`}
                    onClick={() => setFilter('approved')}
                >
                    ✅ Onaylı ({approvedCount})
                </button>
                <button
                    className={`admin-btn ${filter === 'all' ? '' : 'secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    Tümü ({reviews.length})
                </button>
            </div>

            <div className="admin-card">
                {reviews.length === 0 ? (
                    <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>
                        {filter === 'pending' ? 'Bekleyen yorum yok.' : 'Yorum bulunamadı.'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map(review => (
                            <div key={review._id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1rem',
                                borderLeft: `4px solid ${review.isApproved ? '#22c55e' : '#eab308'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{renderStars(review.rating)}</span>
                                            <span style={{ fontWeight: 600 }}>{review.customerName}</span>
                                            {review.isVerifiedPurchase && (
                                                <span style={{
                                                    background: 'rgba(34,197,94,0.2)',
                                                    color: '#22c55e',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    ✓ Doğrulanmış Satın Alma
                                                </span>
                                            )}
                                            <span className={`status-badge ${review.isApproved ? 'confirmed' : 'pending'}`}>
                                                {review.isApproved ? 'Onaylı' : 'Bekliyor'}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                            {review.activity?.name || 'Bilinmeyen Aktivite'} • {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                                        </p>

                                        {review.title && (
                                            <h4 style={{ marginBottom: '0.5rem' }}>{review.title}</h4>
                                        )}
                                        <p style={{ fontSize: '0.95rem' }}>{review.comment}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                        {!review.isApproved && (
                                            <button
                                                onClick={() => handleApprove(review._id)}
                                                className="admin-btn"
                                                style={{ padding: '0.5rem 1rem' }}
                                            >
                                                ✓ Onayla
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            className="admin-btn secondary"
                                            style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.2)' }}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
