'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { value: 'general', label: 'Genel', label_en: 'General' },
    { value: 'booking', label: 'Rezervasyon', label_en: 'Booking' },
    { value: 'payment', label: 'Ödeme', label_en: 'Payment' },
    { value: 'activity', label: 'Aktivite', label_en: 'Activity' },
    { value: 'safety', label: 'Güvenlik', label_en: 'Safety' }
];

export default function AdminFAQPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [faqs, setFaqs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [formData, setFormData] = useState({
        question: '',
        question_en: '',
        answer: '',
        answer_en: '',
        category: 'general',
        isActive: true
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) fetchFaqs();
    }, [user]);

    const fetchFaqs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/faq/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setFaqs(result.data || []);
            }
        } catch (error) {
            console.error('FAQ fetch error:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editItem ? `/api/faq/${editItem._id}` : '/api/faq';
            const method = editItem ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchFaqs();
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleEdit = (faq) => {
        setEditItem(faq);
        setFormData({
            question: faq.question,
            question_en: faq.question_en || '',
            answer: faq.answer,
            answer_en: faq.answer_en || '',
            category: faq.category,
            isActive: faq.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu SSS\'yi silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/faq/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFaqs();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const toggleActive = async (faq) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/faq/${faq._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...faq, isActive: !faq.isActive })
            });
            fetchFaqs();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            question: '',
            question_en: '',
            answer: '',
            answer_en: '',
            category: 'general',
            isActive: true
        });
    };

    const openNew = () => {
        setEditItem(null);
        resetForm();
        setShowModal(true);
    };

    const filteredFaqs = selectedCategory === 'all'
        ? faqs
        : faqs.filter(f => f.category === selectedCategory);

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>❓ SSS Yönetimi</h1>
                <nav className="admin-nav">
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/activities">Aktiviteler</Link>
                    <Link href="/admin/bookings">Rezervasyonlar</Link>
                    <Link href="/admin/gallery">Galeri</Link>
                    <Link href="/admin/faq" className="active">SSS</Link>
                    <Link href="/admin/reviews">Yorumlar</Link>
                    <Link href="/admin/settings">Ayarlar</Link>
                    <button onClick={logout} className="admin-btn secondary">Çıkış</button>
                </nav>
            </header>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="admin-btn" onClick={openNew}>+ Yeni SSS Ekle</button>
                <button
                    className={`admin-btn ${selectedCategory === 'all' ? '' : 'secondary'}`}
                    onClick={() => setSelectedCategory('all')}
                >
                    Tümü ({faqs.length})
                </button>
                {CATEGORIES.map(cat => {
                    const count = faqs.filter(f => f.category === cat.value).length;
                    return (
                        <button
                            key={cat.value}
                            className={`admin-btn ${selectedCategory === cat.value ? '' : 'secondary'}`}
                            onClick={() => setSelectedCategory(cat.value)}
                        >
                            {cat.label} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="admin-card">
                {filteredFaqs.length === 0 ? (
                    <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>Henüz SSS eklenmemiş.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredFaqs.map(faq => (
                            <div key={faq._id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1rem',
                                borderLeft: `4px solid ${faq.isActive ? '#22c55e' : '#ef4444'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span className={`status-badge ${faq.isActive ? 'confirmed' : 'cancelled'}`}>
                                                {faq.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                {CATEGORIES.find(c => c.value === faq.category)?.label}
                                            </span>
                                        </div>
                                        <h4 style={{ marginBottom: '0.5rem' }}>{faq.question}</h4>
                                        {faq.question_en && (
                                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                                                🇬🇧 {faq.question_en}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{faq.answer}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <button onClick={() => toggleActive(faq)} className="admin-btn secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                            {faq.isActive ? '🔴' : '🟢'}
                                        </button>
                                        <button onClick={() => handleEdit(faq)} className="admin-btn secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDelete(faq._id)} className="admin-btn secondary" style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.2)' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <h2>{editItem ? 'SSS Düzenle' : 'Yeni SSS Ekle'}</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Kategori</label>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Soru (TR) *</label>
                                <textarea
                                    className="admin-input"
                                    rows={2}
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Question (EN)</label>
                                <textarea
                                    className="admin-input"
                                    rows={2}
                                    value={formData.question_en}
                                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Cevap (TR) *</label>
                                <textarea
                                    className="admin-input"
                                    rows={4}
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Answer (EN)</label>
                                <textarea
                                    className="admin-input"
                                    rows={4}
                                    value={formData.answer_en}
                                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                Aktif
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="admin-btn" onClick={handleSubmit}>
                                {editItem ? 'Güncelle' : 'Ekle'}
                            </button>
                            <button className="admin-btn secondary" onClick={() => setShowModal(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: #1a1a2e;
                    padding: 2rem;
                    border-radius: 16px;
                    width: 90%;
                }
                .modal-content h2 {
                    margin-bottom: 1.5rem;
                }
            `}</style>
        </div>
    );
}
