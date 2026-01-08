'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { id: 'navigation', name: 'Navigasyon', icon: '🧭' },
    { id: 'hero', name: 'Hero Bölümü', icon: '🎯' },
    { id: 'common', name: 'Genel', icon: '📝' },
    { id: 'activity', name: 'Aktivite', icon: '🎈' },
    { id: 'booking', name: 'Rezervasyon', icon: '📅' },
    { id: 'payment', name: 'Ödeme', icon: '💳' },
    { id: 'gallery', name: 'Galeri', icon: '🖼️' },
    { id: 'faq', name: 'SSS', icon: '❓' },
    { id: 'footer', name: 'Footer', icon: '📄' },
    { id: 'error', name: 'Hatalar', icon: '⚠️' },
    { id: 'seo', name: 'SEO', icon: '🔍' }
];

export default function TranslationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [translations, setTranslations] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTranslation, setNewTranslation] = useState({ key: '', category: 'common', description: '', translations: {} });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        } else if (user) {
            fetchTranslations();
        }
    }, [user, loading, router]);

    const fetchTranslations = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/translations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTranslations(data.data || []);
                setLanguages(data.languages || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedTranslations = async () => {
        if (!confirm('Varsayılan çevirileri yüklemek istiyor musunuz? Mevcut çeviriler korunacak.')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/translations/seed', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMessage({ text: data.message, type: 'success' });
            fetchTranslations();
        } catch (error) {
            setMessage({ text: 'Seed başarısız', type: 'error' });
        }
    };

    const handleEdit = (translation) => {
        setEditingId(translation._id);
        const transObj = {};
        if (translation.translations) {
            // Handle Map-like structure from MongoDB
            if (translation.translations instanceof Map) {
                translation.translations.forEach((value, key) => {
                    transObj[key] = value;
                });
            } else {
                Object.entries(translation.translations).forEach(([key, value]) => {
                    transObj[key] = value;
                });
            }
        }
        setEditData(transObj);
    };

    const handleSave = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/translations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ translations: editData })
            });

            if (res.ok) {
                setMessage({ text: 'Çeviri güncellendi', type: 'success' });
                setEditingId(null);
                fetchTranslations();
            } else {
                setMessage({ text: 'Güncelleme başarısız', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Hata oluştu', type: 'error' });
        }
    };

    const handleAddTranslation = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/translations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newTranslation)
            });

            if (res.ok) {
                setMessage({ text: 'Çeviri eklendi', type: 'success' });
                setShowAddModal(false);
                setNewTranslation({ key: '', category: 'common', description: '', translations: {} });
                fetchTranslations();
            } else {
                const data = await res.json();
                setMessage({ text: data.message || 'Ekleme başarısız', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Hata oluştu', type: 'error' });
        }
    };

    const handleDelete = async (id, isSystem) => {
        if (isSystem) {
            setMessage({ text: 'Sistem çevirileri silinemez', type: 'error' });
            return;
        }
        if (!confirm('Bu çeviriyi silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/translations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setMessage({ text: 'Çeviri silindi', type: 'success' });
                fetchTranslations();
            }
        } catch (error) {
            setMessage({ text: 'Silme başarısız', type: 'error' });
        }
    };

    // Filter translations
    const filteredTranslations = translations.filter(t => {
        const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
        const matchSearch = !searchQuery ||
            t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Object.values(t.translations || {}).some(v =>
                String(v).toLowerCase().includes(searchQuery.toLowerCase())
            );
        return matchCategory && matchSearch;
    });

    // Group by category for display
    const groupedTranslations = filteredTranslations.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
    }, {});

    if (loading || isLoading) return <div className="admin-container">Yükleniyor...</div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>🌐 Çeviri Yönetimi</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        Site metinlerini farklı dillerde düzenleyin • {translations.length} çeviri • {languages.length} aktif dil
                    </p>
                </div>
            </header>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: message.type === 'success' ? '#22c55e' : '#ef4444',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    {message.text}
                    <button
                        onClick={() => setMessage({ text: '', type: '' })}
                        style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    >✕</button>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Category Filter */}
                <select
                    className="admin-input"
                    style={{ width: 'auto', marginBottom: 0 }}
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="all">Tüm Kategoriler</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>

                {/* Search */}
                <input
                    type="text"
                    className="admin-input"
                    placeholder="🔍 Ara..."
                    style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />

                {/* Actions */}
                <button className="admin-btn" onClick={() => setShowAddModal(true)}>
                    + Yeni Çeviri
                </button>
                {translations.length === 0 && (
                    <button className="admin-btn secondary" onClick={handleSeedTranslations}>
                        🌱 Varsayılanları Yükle
                    </button>
                )}
            </div>

            {/* Active Languages Info */}
            <div style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Aktif Diller:</span>
                {languages.map(lang => (
                    <span
                        key={lang.code}
                        style={{
                            background: 'rgba(249, 115, 22, 0.2)',
                            color: '#f97316',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}
                    >
                        {lang.flag} {lang.name}
                    </span>
                ))}
                {languages.length === 0 && (
                    <span style={{ color: '#ef4444' }}>Dil yok - önce Diller sayfasından dil ekleyin</span>
                )}
            </div>

            {/* Translations by Category */}
            {Object.entries(groupedTranslations).map(([category, items]) => {
                const catInfo = CATEGORIES.find(c => c.id === category) || { icon: '📁', name: category };
                return (
                    <div key={category} className="admin-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            {catInfo.icon} {catInfo.name}
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                ({items.length} çeviri)
                            </span>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {items.map(t => (
                                <div
                                    key={t._id}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: editingId === t._id ? '1px solid #f97316' : '1px solid transparent'
                                    }}
                                >
                                    {/* Key and Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div>
                                            <code style={{
                                                background: 'rgba(249, 115, 22, 0.2)',
                                                color: '#f97316',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {t.key}
                                            </code>
                                            {t.isSystem && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#3b82f6',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    sistem
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {editingId === t._id ? (
                                                <>
                                                    <button
                                                        className="admin-btn"
                                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                                                        onClick={() => handleSave(t._id)}
                                                    >
                                                        💾 Kaydet
                                                    </button>
                                                    <button
                                                        className="admin-btn secondary"
                                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        İptal
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                        title="Düzenle"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {!t.isSystem && (
                                                        <button
                                                            onClick={() => handleDelete(t._id, t.isSystem)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                            title="Sil"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Translations Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                                        {languages.map(lang => {
                                            const value = editingId === t._id
                                                ? (editData[lang.code] || '')
                                                : (t.translations?.[lang.code] || t.translations?.get?.(lang.code) || '');
                                            const isEmpty = !value;

                                            return (
                                                <div key={lang.code}>
                                                    <label style={{
                                                        display: 'block',
                                                        marginBottom: '0.25rem',
                                                        fontSize: '0.8rem',
                                                        color: isEmpty ? '#f97316' : 'rgba(255,255,255,0.6)'
                                                    }}>
                                                        {lang.flag} {lang.name}
                                                        {isEmpty && <span style={{ marginLeft: '0.25rem' }}>⚠️</span>}
                                                    </label>
                                                    {editingId === t._id ? (
                                                        <input
                                                            type="text"
                                                            className="admin-input"
                                                            style={{ marginBottom: 0, fontSize: '0.9rem' }}
                                                            value={editData[lang.code] || ''}
                                                            onChange={e => setEditData({ ...editData, [lang.code]: e.target.value })}
                                                            placeholder={`${lang.name} çevirisi...`}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            padding: '0.5rem 0.75rem',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.9rem',
                                                            color: isEmpty ? 'rgba(255,255,255,0.3)' : 'white',
                                                            fontStyle: isEmpty ? 'italic' : 'normal'
                                                        }}>
                                                            {value || 'Çeviri yok'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredTranslations.length === 0 && (
                <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {translations.length === 0
                            ? 'Henüz çeviri yok. "Varsayılanları Yükle" butonuna tıklayın.'
                            : 'Aramanızla eşleşen çeviri bulunamadı.'
                        }
                    </p>
                </div>
            )}

            {/* Add Translation Modal */}
            {showAddModal && (
                <div className="modal-backdrop">
                    <div className="modal-card" style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>➕ Yeni Çeviri Ekle</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Anahtar (key)
                                </label>
                                <input
                                    className="admin-input"
                                    value={newTranslation.key}
                                    onChange={e => setNewTranslation({ ...newTranslation, key: e.target.value })}
                                    placeholder="örn: custom.welcomeMessage"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Kategori
                                </label>
                                <select
                                    className="admin-input"
                                    value={newTranslation.category}
                                    onChange={e => setNewTranslation({ ...newTranslation, category: e.target.value })}
                                    style={{ marginBottom: 0 }}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Açıklama (opsiyonel)
                                </label>
                                <input
                                    className="admin-input"
                                    value={newTranslation.description}
                                    onChange={e => setNewTranslation({ ...newTranslation, description: e.target.value })}
                                    placeholder="Bu çevirinin kullanım amacı..."
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Çeviriler
                                </label>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {languages.map(lang => (
                                        <div key={lang.code}>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                {lang.flag} {lang.name}
                                            </label>
                                            <input
                                                className="admin-input"
                                                value={newTranslation.translations[lang.code] || ''}
                                                onChange={e => setNewTranslation({
                                                    ...newTranslation,
                                                    translations: { ...newTranslation.translations, [lang.code]: e.target.value }
                                                })}
                                                placeholder={`${lang.name} çevirisi...`}
                                                style={{ marginBottom: 0 }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="admin-btn" style={{ flex: 1 }} onClick={handleAddTranslation}>
                                    💾 Kaydet
                                </button>
                                <button
                                    className="admin-btn secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowAddModal(false)}
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
