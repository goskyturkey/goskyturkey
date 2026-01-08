'use client';

import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './booking.css';

export default function BookingForm({ activity }) {
    const router = useRouter();
    const { t } = useLanguage();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', guests: 1, notes: '' });
    const [error, setError] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (date) => {
        setFormData(prev => ({ ...prev, date }));
        setShowCalendar(false);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.date) {
            setError(t('booking.error.selectDate') || 'Lütfen bir tarih seçin');
            return;
        }

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
                if (res.status === 400) {
                    setError(t('booking.error.validation'));
                } else if (res.status === 404) {
                    setError(t('booking.error.notFound'));
                } else if (res.status === 429) {
                    setError(t('booking.error.tooManyRequests'));
                } else if (res.status >= 500) {
                    setError(t('booking.error.server'));
                } else {
                    setError(result.message || t('booking.error.general'));
                }
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError(t('booking.error.connection'));
            } else {
                setError(t('booking.error.unexpected'));
            }
            console.error('Booking error:', error);
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
                    <Image src="/images/logo.webp" alt="GoSkyTurkey" width={120} height={35} />
                </Link>
                <Link href={`/activity/${activity.slug}`} className="back-link">← {t('booking.back')}</Link>
            </header>

            <main className="booking-main">
                <div className="booking-container">
                    <div className="booking-info">
                        <Image src={activity.thumbnailImage || activity.image || activity.images?.[0] || '/images/paragliding.webp'} alt={activity.name} width={400} height={250} style={{ borderRadius: '12px', objectFit: 'cover', width: '100%', height: 'auto' }} />
                        <h2>{activity.name}</h2>
                        <div className="price-display">
                            {activity.discountPrice && <span className="old-price">{activity.price.toLocaleString()} ₺</span>}
                            <span className="current-price">{unitPrice.toLocaleString()} ₺</span>
                            <span className="per-person">/ {t('booking.perPerson')}</span>
                        </div>
                    </div>

                    <form className="booking-form" onSubmit={handleSubmit}>
                        <h1>{t('booking.title')}</h1>

                        {error && (
                            <div className="form-error">
                                {error}
                            </div>
                        )}

                        <div className="form-section">
                            <h3>{t('booking.personalInfo')}</h3>
                            <input type="text" name="name" placeholder={t('booking.fullName')} value={formData.name} onChange={handleChange} required />
                            <input type="email" name="email" placeholder={t('booking.email')} value={formData.email} onChange={handleChange} required />
                            <input type="tel" name="phone" placeholder={t('booking.phone')} value={formData.phone} onChange={handleChange} required />
                        </div>

                        <div className="form-section">
                            <h3>{t('booking.details')}</h3>

                            {/* Date Selection with Calendar */}
                            <div className="date-picker-wrapper">
                                <button
                                    type="button"
                                    className="date-picker-btn"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                >
                                    <span className="date-icon">📅</span>
                                    <span className="date-text">
                                        {formData.date ? formatDisplayDate(formData.date) : (t('booking.selectDate') || 'Tarih Seçin')}
                                    </span>
                                    <span className="date-arrow">{showCalendar ? '▲' : '▼'}</span>
                                </button>

                                {showCalendar && (
                                    <div className="calendar-dropdown">
                                        <AvailabilityCalendar
                                            activityId={activity._id}
                                            onSelectDate={handleDateSelect}
                                            selectedDate={formData.date}
                                        />
                                    </div>
                                )}
                            </div>

                            <select name="guests" value={formData.guests} onChange={handleChange}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} {t('booking.person')}</option>)}
                            </select>
                            <textarea name="notes" placeholder={t('booking.notes')} value={formData.notes} onChange={handleChange} rows={3} />
                        </div>

                        <div className="booking-summary">
                            <div className="summary-row">
                                <span>{unitPrice.toLocaleString()} ₺ x {formData.guests} {t('booking.person')}</span>
                                <span>{totalPrice.toLocaleString()} ₺</span>
                            </div>
                            <div className="summary-total">
                                <span>{t('booking.total')}</span>
                                <span>{totalPrice.toLocaleString()} ₺</span>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting || !formData.date}>
                            {submitting ? t('booking.processing') : t('booking.proceedToPayment')}
                        </button>
                    </form>
                </div>
            </main>

            <style jsx>{`
                .date-picker-wrapper {
                    position: relative;
                    margin-bottom: 1rem;
                }
                .date-picker-btn {
                    width: 100%;
                    padding: 1rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .date-picker-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: #f97316;
                }
                .date-icon {
                    font-size: 1.2rem;
                }
                .date-text {
                    flex: 1;
                    text-align: left;
                }
                .date-arrow {
                    opacity: 0.5;
                    font-size: 0.8rem;
                }
                .calendar-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    margin-top: 0.5rem;
                    background: #1a1a2e;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
