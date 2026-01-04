'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './booking.css';

export default function BookingForm({ activity }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', guests: 1, notes: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const guestCount = Number(formData.guests);
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    guests: guestCount,
                    activity: activity._id,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    totalPrice: (activity.discountPrice || activity.price) * guestCount,
                }),
            });
            const result = await res.json();
            if (res.ok && result.data?._id) {
                router.push(`/payment/${result.data._id}`);
            } else {
                setError(result.message || 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
            }
        } catch (error) {
            setError('Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const unitPrice = activity.discountPrice || activity.price;
    const guestCount = Number(formData.guests) || 1;
    const totalPrice = unitPrice * guestCount;

    return (
        <div className="booking-page">
            <header className="booking-header">
                <Link href="/" className="header-logo">
                    <Image src="/images/logo.png" alt="GoSky Turkey" width={120} height={35} />
                </Link>
                <Link href={`/activity/${activity.slug}`} className="back-link">← Geri</Link>
            </header>

            <main className="booking-main">
                <div className="booking-container">
                    <div className="booking-info">
                        <Image src={activity.image || '/images/paragliding.png'} alt={activity.name} width={400} height={250} style={{ borderRadius: '12px', objectFit: 'cover', width: '100%', height: 'auto' }} />
                        <h2>{activity.name}</h2>
                        <div className="price-display">
                            {activity.discountPrice && <span className="old-price">{activity.price.toLocaleString()} ₺</span>}
                            <span className="current-price">{unitPrice.toLocaleString()} ₺</span>
                            <span className="per-person">/ kişi</span>
                        </div>
                    </div>

                    <form className="booking-form" onSubmit={handleSubmit}>
                        <h1>Rezervasyon</h1>

                        {error && (
                            <div className="form-error">
                                {error}
                            </div>
                        )}

                        <div className="form-section">
                            <h3>Kişisel Bilgiler</h3>
                            <input type="text" name="name" placeholder="Ad Soyad" value={formData.name} onChange={handleChange} required />
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                            <input type="tel" name="phone" placeholder="Telefon" value={formData.phone} onChange={handleChange} required />
                        </div>

                        <div className="form-section">
                            <h3>Rezervasyon Detayları</h3>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                            <select name="guests" value={formData.guests} onChange={handleChange}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Kişi</option>)}
                            </select>
                            <textarea name="notes" placeholder="Notlar (Opsiyonel)" value={formData.notes} onChange={handleChange} rows={3} />
                        </div>

                        <div className="booking-summary">
                            <div className="summary-row">
                                <span>{unitPrice.toLocaleString()} ₺ x {formData.guests} kişi</span>
                                <span>{totalPrice.toLocaleString()} ₺</span>
                            </div>
                            <div className="summary-total">
                                <span>Toplam</span>
                                <span>{totalPrice.toLocaleString()} ₺</span>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? 'İşleniyor...' : 'Ödemeye Geç'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
