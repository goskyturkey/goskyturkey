'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const CATEGORIES = [
    { value: 'general', label: 'Genel' },
    { value: 'paragliding', label: 'Yamaç Paraşütü' },
    { value: 'gyrocopter', label: 'Gyrocopter' },
    { value: 'balloon', label: 'Balon' }
];

// Helper to extract localized value from i18n object
const getLocalizedValue = (field, locale = 'tr') => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
        return field[locale] || field.tr || field.en || '';
    }
    return '';
};

export default function AdminGalleryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const fileInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        title_en: '',
        description: '',
        description_en: '',
        category: 'general',
        isFeatured: false,
        tags: ''
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchItems();
        }
    }, [user]);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/gallery/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setItems(result.data || []);
            }
        } catch (error) {
            console.error('Gallery fetch error:', error);
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const token = localStorage.getItem('adminToken');

        for (const file of files) {
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);
            formDataUpload.append('title', file.name.replace(/\.[^/.]+$/, ''));
            formDataUpload.append('category', formData.category);
            formDataUpload.append('isFeatured', formData.isFeatured);

            try {
                await fetch('/api/gallery', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formDataUpload
                });
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        setIsUploading(false);
        fetchItems();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu resmi silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/gallery/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        // Extract localized values from i18n objects
        const titleTr = typeof item.title === 'object' ? item.title.tr : item.title || '';
        const titleEn = typeof item.title === 'object' ? item.title.en : '';
        const descTr = typeof item.description === 'object' ? item.description.tr : item.description || '';
        const descEn = typeof item.description === 'object' ? item.description.en : '';
        const tagsStr = Array.isArray(item.tags) ? item.tags.join(', ') : '';

        setFormData({
            title: titleTr,
            title_en: titleEn,
            description: descTr,
            description_en: descEn,
            category: item.category,
            isFeatured: item.isFeatured,
            tags: tagsStr
        });
        setShowModal(true);
    };

    const handleUpdate = async () => {
        if (!editItem) return;

        try {
            const token = localStorage.getItem('adminToken');
            // Format data for backend with i18n objects
            const updateData = {
                title: { tr: formData.title, en: formData.title_en },
                description: { tr: formData.description, en: formData.description_en },
                category: formData.category,
                isFeatured: formData.isFeatured,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            };

            await fetch(`/api/gallery/${editItem._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            setShowModal(false);
            setEditItem(null);
            fetchItems();
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const toggleFeatured = async (item) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/gallery/${item._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...item, isFeatured: !item.isFeatured })
            });
            fetchItems();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(item => item.category === selectedCategory);

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>🖼️ Galeri Yönetimi</h1>
            </header>

            {/* Upload Section */}
            <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>📤 Resim Yükle</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        className="admin-input"
                        style={{ width: 'auto', marginBottom: 0 }}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        />
                        Öne Çıkan
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                    />
                    <button
                        className="admin-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Yükleniyor...' : '+ Resim Seç'}
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    className={`admin-btn ${selectedCategory === 'all' ? '' : 'secondary'}`}
                    onClick={() => setSelectedCategory('all')}
                >
                    Tümü ({items.length})
                </button>
                {CATEGORIES.map(cat => {
                    const count = items.filter(i => i.category === cat.value).length;
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

            {/* Gallery Grid */}
            <div className="gallery-grid">
                {filteredItems.map(item => (
                    <div key={item._id} className="gallery-item">
                        <div className="gallery-image">
                            <img src={item.imageUrl} alt={getLocalizedValue(item.title)} />
                            {item.isFeatured && <span className="featured-badge">⭐</span>}
                        </div>
                        <div className="gallery-info">
                            <h4>{getLocalizedValue(item.title)}</h4>
                            <span className="category-tag">{CATEGORIES.find(c => c.value === item.category)?.label}</span>
                            {item.tags && item.tags.length > 0 && (
                                <div className="gallery-tags">
                                    {item.tags.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="tag-pill">#{tag}</span>
                                    ))}
                                    {item.tags.length > 3 && <span className="tag-more">+{item.tags.length - 3}</span>}
                                </div>
                            )}
                        </div>
                        <div className="gallery-actions">
                            <button onClick={() => toggleFeatured(item)} title="Öne Çıkar">
                                {item.isFeatured ? '⭐' : '☆'}
                            </button>
                            <button onClick={() => handleEdit(item)} title="Düzenle">✏️</button>
                            <button onClick={() => handleDelete(item._id)} title="Sil">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ opacity: 0.7 }}>Bu kategoride henüz resim yok.</p>
                </div>
            )}

            {/* Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Resim Düzenle</h2>

                        {/* Turkish Fields */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>🇹🇷 Türkçe Başlık</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="Başlık (TR)"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>🇹🇷 Türkçe Açıklama</label>
                            <textarea
                                className="admin-input"
                                placeholder="Açıklama (TR)"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        {/* English Fields */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>🇬🇧 English Title</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="Title (EN)"
                                value={formData.title_en}
                                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>🇬🇧 English Description</label>
                            <textarea
                                className="admin-input"
                                placeholder="Description (EN)"
                                rows={2}
                                value={formData.description_en}
                                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        {/* Tags Input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>🏷️ Etiketler (Hashtags)</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="paragliding, fethiye, sunset (virgülle ayırın)"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                style={{ marginBottom: 0 }}
                            />
                            <small style={{ opacity: 0.5, fontSize: '0.75rem' }}>Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</small>
                        </div>

                        <select
                            className="admin-input"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            />
                            Öne Çıkan
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="admin-btn" onClick={handleUpdate}>Kaydet</button>
                            <button className="admin-btn secondary" onClick={() => setShowModal(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .gallery-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: transform 0.2s;
                }
                .gallery-item:hover {
                    transform: translateY(-4px);
                }
                .gallery-image {
                    position: relative;
                    aspect-ratio: 4/3;
                    overflow: hidden;
                }
                .gallery-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .featured-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(0,0,0,0.6);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .gallery-info {
                    padding: 0.75rem;
                }
                .gallery-info h4 {
                    font-size: 0.9rem;
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .category-tag {
                    font-size: 0.75rem;
                    opacity: 0.7;
                }
                .gallery-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                    margin-top: 0.5rem;
                }
                .tag-pill {
                    font-size: 0.65rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2px 6px;
                    border-radius: 10px;
                    opacity: 0.9;
                }
                .tag-more {
                    font-size: 0.65rem;
                    opacity: 0.5;
                    padding: 2px 4px;
                }
                .gallery-actions {
                    display: flex;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .gallery-actions button {
                    flex: 1;
                    padding: 0.5rem;
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .gallery-actions button:hover {
                    background: rgba(255,255,255,0.1);
                }
                .gallery-actions button:not(:last-child) {
                    border-right: 1px solid rgba(255,255,255,0.1);
                }
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
                    max-width: 500px;
                }
                .modal-content h2 {
                    margin-bottom: 1.5rem;
                }
            `}</style>
        </div>
    );
}
