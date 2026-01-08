'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CouponsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minAmount: '',
        maxUses: '',
        expiresAt: '',
        isActive: true
    });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        } else if (user) {
            fetchCoupons();
        }
    }, [user, loading, router]);

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/coupons', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.data || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    discountValue: Number(formData.discountValue),
                    minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
                    maxUses: formData.maxUses ? Number(formData.maxUses) : undefined
                })
            });

            if (res.ok) {
                setMessage({ text: editingId ? 'Kupon güncellendi' : 'Kupon oluşturuldu', type: 'success' });
                setShowModal(false);
                resetForm();
                fetchCoupons();
            } else {
                const data = await res.json();
                setMessage({ text: data.message || 'Hata oluştu', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Bağlantı hatası', type: 'error' });
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minAmount: '',
            maxUses: '',
            expiresAt: '',
            isActive: true
        });
        setEditingId(null);
    };

    const handleEdit = (coupon) => {
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minAmount: coupon.minAmount || '',
            maxUses: coupon.maxUses || '',
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
            isActive: coupon.isActive
        });
        setEditingId(coupon._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/coupons/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setMessage({ text: 'Kupon silindi', type: 'success' });
                fetchCoupons();
            }
        } catch (error) {
            setMessage({ text: 'Silme başarısız', type: 'error' });
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('tr-TR');
    };

    if (loading || isLoading) {
        return (
            <div className="admin-container">
                <div className="empty-state">
                    <div className="empty-state__icon">⏳</div>
                    <div className="empty-state__title">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>🎟️ Kupon Yönetimi</h1>
                    <p>İndirim kuponlarını buradan yönetebilirsiniz</p>
                </div>
                <button className="admin-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                    + Yeni Kupon
                </button>
            </header>

            {message.text && (
                <div className={`admin-alert ${message.type}`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <div>{message.text}</div>
                    <button
                        onClick={() => setMessage({ text: '', type: '' })}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    >✕</button>
                </div>
            )}

            <div className="admin-card">
                {coupons.length > 0 ? (
                    <div className="admin-table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Kupon Kodu</th>
                                    <th>İndirim</th>
                                    <th>Min. Tutar</th>
                                    <th>Kullanım</th>
                                    <th>Bitiş</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon._id}>
                                        <td>
                                            <code style={{
                                                background: 'rgba(249, 115, 22, 0.2)',
                                                color: '#f97316',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontWeight: 600
                                            }}>
                                                {coupon.code}
                                            </code>
                                        </td>
                                        <td>
                                            {coupon.discountType === 'percentage'
                                                ? `%${coupon.discountValue}`
                                                : `${coupon.discountValue} ₺`
                                            }
                                        </td>
                                        <td>{coupon.minAmount ? `${coupon.minAmount} ₺` : '-'}</td>
                                        <td>{coupon.usedCount || 0} / {coupon.maxUses || '∞'}</td>
                                        <td>{formatDate(coupon.expiresAt)}</td>
                                        <td>
                                            <span className={`status-badge ${coupon.isActive ? 'active' : 'inactive'}`}>
                                                {coupon.isActive ? '✓ Aktif' : '✗ Pasif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-btn-group">
                                                <button
                                                    className="admin-btn secondary small"
                                                    onClick={() => handleEdit(coupon)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="admin-btn danger small"
                                                    onClick={() => handleDelete(coupon._id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state__icon">🎟️</div>
                        <div className="empty-state__title">Henüz kupon yok</div>
                        <div className="empty-state__text">İlk kuponunuzu oluşturmak için "Yeni Kupon" butonuna tıklayın</div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2>{editingId ? '✏️ Kuponu Düzenle' : '➕ Yeni Kupon Oluştur'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="admin-label">Kupon Kodu</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="örn: YENI2024"
                                    required
                                    style={{ textTransform: 'uppercase', marginBottom: 0 }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="admin-label">İndirim Tipi</label>
                                    <select
                                        className="admin-input"
                                        value={formData.discountType}
                                        onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <option value="percentage">Yüzde (%)</option>
                                        <option value="fixed">Sabit (₺)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="admin-label">İndirim Değeri</label>
                                    <input
                                        type="number"
                                        className="admin-input"
                                        value={formData.discountValue}
                                        onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                        placeholder={formData.discountType === 'percentage' ? 'örn: 15' : 'örn: 100'}
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="admin-label">Min. Sepet Tutarı (opsiyonel)</label>
                                    <input
                                        type="number"
                                        className="admin-input"
                                        value={formData.minAmount}
                                        onChange={e => setFormData({ ...formData, minAmount: e.target.value })}
                                        placeholder="örn: 500"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="admin-label">Maks. Kullanım (opsiyonel)</label>
                                    <input
                                        type="number"
                                        className="admin-input"
                                        value={formData.maxUses}
                                        onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="örn: 100"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="admin-label">Bitiş Tarihi (opsiyonel)</label>
                                <input
                                    type="date"
                                    className="admin-input"
                                    value={formData.expiresAt}
                                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <div className="form-group" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px'
                            }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: '20px', height: '20px', accentColor: '#f97316' }}
                                />
                                <label htmlFor="isActive" style={{ cursor: 'pointer' }}>Kupon Aktif</label>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="admin-btn">
                                    💾 Kaydet
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn secondary"
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
