'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LanguagesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [languages, setLanguages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        flag: '',
        isActive: true,
        order: 0
    });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        } else if (user) {
            fetchLanguages();
        }
    }, [user, loading, router]);

    const fetchLanguages = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/languages/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLanguages(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const url = editingId ? `/api/languages/${editingId}` : '/api/languages';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage(editingId ? 'Dil güncellendi' : 'Dil eklendi');
                setShowModal(false);
                setFormData({ code: '', name: '', flag: '', isActive: true, order: 0 });
                setEditingId(null);
                fetchLanguages();
            } else {
                setMessage('Hata oluştu');
            }
        } catch (error) {
            setMessage('Bağlantı hatası');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu dili silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/languages/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchLanguages();
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleEdit = (lang) => {
        setFormData({
            code: lang.code,
            name: lang.name,
            flag: lang.flag,
            isActive: lang.isActive,
            order: lang.order
        });
        setEditingId(lang._id);
        setShowModal(true);
    };

    if (loading || isLoading) return <div className="admin-container">Yükleniyor...</div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>🌍 Dil Yönetimi</h1>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Sitenin destekleyeceği dilleri buradan yönetebilirsin.</p>
                </div>
            </header>

            {message && (
                <div style={{ padding: '1rem', background: '#e0f2f1', color: '#00695c', borderRadius: '8px', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button
                        className="admin-btn"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ code: '', name: '', flag: '', isActive: true, order: 0 });
                            setShowModal(true);
                        }}
                    >
                        + Yeni Dil Ekle
                    </button>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Bayrak</th>
                            <th>Kod</th>
                            <th>Adı</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {languages.map(lang => (
                            <tr key={lang._id}>
                                <td style={{ fontSize: '1.5rem' }}>{lang.flag}</td>
                                <td>
                                    <span style={{
                                        background: 'rgba(249, 115, 22, 0.2)',
                                        color: '#f97316',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontFamily: 'monospace',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        {lang.code}
                                    </span>
                                </td>
                                <td>{lang.name}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500',
                                        background: lang.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: lang.isActive ? '#22c55e' : '#ef4444'
                                    }}>
                                        {lang.isActive ? '✓ Aktif' : '✗ Pasif'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(lang)}
                                        style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lang._id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>
                            {editingId ? '✏️ Dili Düzenle' : '➕ Yeni Dil Ekle'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Dil Kodu (ISO 2)
                                </label>
                                <input
                                    className="admin-input"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                    placeholder="örn: TR"
                                    maxLength={2}
                                    required
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Dil Adı
                                </label>
                                <input
                                    className="admin-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="örn: Türkçe"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Bayrak (Emoji)
                                </label>
                                <input
                                    className="admin-input"
                                    value={formData.flag}
                                    onChange={e => setFormData({ ...formData, flag: e.target.value })}
                                    placeholder="örn: 🇹🇷"
                                    style={{ fontSize: '1.5rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: '20px', height: '20px', accentColor: '#f97316' }}
                                />
                                <label htmlFor="isActive" style={{ color: '#fff', cursor: 'pointer' }}>Aktif</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="admin-btn" style={{ flex: 1, padding: '0.75rem' }}>
                                    💾 Kaydet
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn secondary"
                                    style={{ flex: 1, padding: '0.75rem' }}
                                    onClick={() => setShowModal(false)}
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
