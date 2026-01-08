'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function AvailabilityContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();

    const activityId = searchParams.get('activityId');
    const [activity, setActivity] = useState(null);
    const [calendar, setCalendar] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDates, setSelectedDates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('single'); // single, range
    const [formData, setFormData] = useState({
        isBlocked: false,
        blockReason: '',
        maxCapacity: 10
    });
    const [message, setMessage] = useState('');
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    // Fetch activities list for selection
    useEffect(() => {
        if (user) {
            fetchActivities();
        }
    }, [user]);

    // Fetch calendar when activity or month changes
    useEffect(() => {
        if (activityId) {
            fetchActivity();
            fetchCalendar();
        }
    }, [activityId, currentMonth, currentYear]);

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/activities');
            if (res.ok) {
                const result = await res.json();
                setActivities(result.data || []);
            }
        } catch (error) {
            console.error('Activities fetch error:', error);
        }
    };

    const fetchActivity = async () => {
        try {
            const res = await fetch(`/api/activities/${activityId}`);
            if (res.ok) {
                const result = await res.json();
                setActivity(result.data || result);
            }
        } catch (error) {
            console.error('Activity fetch error:', error);
        }
    };

    const fetchCalendar = useCallback(async () => {
        try {
            const res = await fetch(`/api/availability/${activityId}?month=${currentMonth}&year=${currentYear}`);
            if (res.ok) {
                const result = await res.json();
                setCalendar(result.data || []);
            }
        } catch (error) {
            console.error('Calendar fetch error:', error);
        }
    }, [activityId, currentMonth, currentYear]);

    const handleDateClick = (dateStr) => {
        if (selectedDates.includes(dateStr)) {
            setSelectedDates(selectedDates.filter(d => d !== dateStr));
        } else {
            setSelectedDates([...selectedDates, dateStr]);
        }
    };

    const handleSelectAll = () => {
        const allDates = calendar.filter(d => !d.isBlocked).map(d => d.date);
        setSelectedDates(allDates);
    };

    const handleClearSelection = () => {
        setSelectedDates([]);
    };

    const handleOpenDates = async () => {
        if (selectedDates.length === 0) return;

        setMessage('Tarihler açılıyor...');
        try {
            const token = localStorage.getItem('adminToken');

            for (const date of selectedDates) {
                await fetch(`/api/availability/${activityId}/${date}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isBlocked: false,
                        maxCapacity: formData.maxCapacity
                    })
                });
            }

            setMessage(`✅ ${selectedDates.length} tarih açıldı!`);
            setSelectedDates([]);
            fetchCalendar();
        } catch (error) {
            setMessage('❌ Hata oluştu');
        }
    };

    const handleCloseDates = async () => {
        if (selectedDates.length === 0) return;

        setMessage('Tarihler kapatılıyor...');
        try {
            const token = localStorage.getItem('adminToken');

            for (const date of selectedDates) {
                await fetch(`/api/availability/${activityId}/${date}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isBlocked: true,
                        blockReason: formData.blockReason || 'Admin tarafından kapatıldı'
                    })
                });
            }

            setMessage(`✅ ${selectedDates.length} tarih kapatıldı!`);
            setSelectedDates([]);
            fetchCalendar();
        } catch (error) {
            setMessage('❌ Hata oluştu');
        }
    };

    const handleBulkOpen = async () => {
        setShowModal(true);
        setModalMode('range');
    };

    const handleBulkSubmit = async () => {
        const token = localStorage.getItem('adminToken');
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            setMessage('❌ Başlangıç ve bitiş tarihi seçin');
            return;
        }

        try {
            const res = await fetch('/api/availability/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    activityId,
                    startDate,
                    endDate,
                    isBlocked: formData.isBlocked,
                    blockReason: formData.blockReason
                })
            });

            if (res.ok) {
                const result = await res.json();
                setMessage(`✅ ${result.message}`);
                setShowModal(false);
                fetchCalendar();
            }
        } catch (error) {
            setMessage('❌ Hata oluştu');
        }
    };

    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            if (currentMonth === 1) {
                setCurrentMonth(12);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        } else {
            if (currentMonth === 12) {
                setCurrentMonth(1);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        }
    };

    // Group calendar by weeks
    const getWeeks = () => {
        const weeks = [];
        let currentWeek = [];

        // Filter only current month
        const monthDays = calendar.filter(d => {
            const date = new Date(d.date);
            return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
        });

        if (monthDays.length === 0) return weeks;

        // Add empty cells for first week
        const firstDay = new Date(monthDays[0].date).getDay();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0
        for (let i = 0; i < adjustedFirstDay; i++) {
            currentWeek.push(null);
        }

        monthDays.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Fill last week
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        return weeks;
    };

    if (loading || !user) {
        return <div className="admin-container">Yükleniyor...</div>;
    }

    // If no activity selected, show activity selection
    if (!activityId) {
        return (
            <div className="admin-container">
                <header className="admin-header">
                    <h1>📅 Müsaitlik Yönetimi</h1>
                </header>

                <div className="admin-card">
                    <h2>Aktivite Seçin</h2>
                    <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
                        Müsaitlik takvimini yönetmek istediğiniz aktiviteyi seçin.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {activities.map(act => (
                            <div
                                key={act._id}
                                onClick={() => router.push(`/admin/availability?activityId=${act._id}`)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '2px solid transparent'
                                }}
                                onMouseEnter={e => e.currentTarget.style.border = '2px solid #f97316'}
                                onMouseLeave={e => e.currentTarget.style.border = '2px solid transparent'}
                            >
                                <h3 style={{ marginBottom: '0.5rem' }}>{act.name}</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{act.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const weeks = getWeeks();

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="admin-btn secondary"
                        onClick={() => router.push('/admin/availability')}
                        style={{ padding: '0.5rem' }}
                    >
                        ←
                    </button>
                    <h1>📅 {activity?.name || 'Müsaitlik'}</h1>
                </div>
            </header>

            {message && (
                <div style={{
                    padding: '0.75rem',
                    background: message.includes('✅') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    color: message.includes('✅') ? '#22c55e' : '#ef4444'
                }}>
                    {message}
                </div>
            )}

            {/* Controls */}
            <div className="admin-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="admin-btn secondary" onClick={handleSelectAll}>Tümünü Seç</button>
                    <button className="admin-btn secondary" onClick={handleClearSelection}>Seçimi Temizle</button>
                    <div style={{ flex: 1 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label>Kontenjan:</label>
                        <input
                            type="number"
                            className="admin-input"
                            style={{ width: '80px' }}
                            value={formData.maxCapacity}
                            onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 10 })}
                            min={1}
                        />
                    </div>
                    <button className="admin-btn" onClick={handleOpenDates} disabled={selectedDates.length === 0}>
                        🟢 Seçilenleri Aç ({selectedDates.length})
                    </button>
                    <button className="admin-btn secondary" onClick={handleCloseDates} disabled={selectedDates.length === 0} style={{ background: 'rgba(239,68,68,0.3)' }}>
                        🔴 Seçilenleri Kapat
                    </button>
                    <button className="admin-btn" onClick={handleBulkOpen}>
                        📅 Tarih Aralığı
                    </button>
                </div>
            </div>

            {/* Calendar */}
            <div className="admin-card">
                {/* Month Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button className="admin-btn secondary" onClick={() => navigateMonth('prev')}>← Önceki</button>
                    <h2 style={{ margin: 0 }}>{MONTHS_TR[currentMonth - 1]} {currentYear}</h2>
                    <button className="admin-btn secondary" onClick={() => navigateMonth('next')}>Sonraki →</button>
                </div>

                {/* Day Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {DAYS_TR.map(day => (
                        <div key={day} style={{ textAlign: 'center', fontWeight: 600, padding: '0.5rem', opacity: 0.7 }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {weeks.flat().map((day, idx) => {
                        if (!day) {
                            return <div key={`empty-${idx}`} style={{ padding: '1rem' }}></div>;
                        }

                        const dateObj = new Date(day.date);
                        const dayNum = dateObj.getDate();
                        const isSelected = selectedDates.includes(day.date);
                        const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0));

                        let bg = 'rgba(255,255,255,0.05)';
                        let border = '2px solid transparent';

                        if (isPast) {
                            bg = 'rgba(100,100,100,0.2)';
                        } else if (day.isBlocked) {
                            bg = 'rgba(239,68,68,0.2)';
                        } else if (day.isAvailable) {
                            bg = 'rgba(34,197,94,0.2)';
                        }

                        if (isSelected) {
                            border = '2px solid #f97316';
                        }

                        return (
                            <div
                                key={day.date}
                                onClick={() => !isPast && handleDateClick(day.date)}
                                style={{
                                    padding: '0.75rem',
                                    background: bg,
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    cursor: isPast ? 'not-allowed' : 'pointer',
                                    border,
                                    opacity: isPast ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{dayNum}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                    {day.isBlocked ? '🔴 Kapalı' :
                                        day.remainingCapacity <= 0 ? '🟡 Dolu' :
                                            `🟢 ${day.remainingCapacity} kişi`}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 16, height: 16, background: 'rgba(34,197,94,0.2)', borderRadius: 4 }}></div>
                        <span style={{ fontSize: '0.85rem' }}>Müsait</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 16, height: 16, background: 'rgba(239,68,68,0.2)', borderRadius: 4 }}></div>
                        <span style={{ fontSize: '0.85rem' }}>Kapalı</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 16, height: 16, background: 'rgba(100,100,100,0.2)', borderRadius: 4 }}></div>
                        <span style={{ fontSize: '0.85rem' }}>Geçmiş</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 16, height: 16, border: '2px solid #f97316', borderRadius: 4 }}></div>
                        <span style={{ fontSize: '0.85rem' }}>Seçili</span>
                    </div>
                </div>
            </div>

            {/* Bulk Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2>📅 Tarih Aralığı Yönetimi</h2>

                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label>Başlangıç Tarihi</label>
                                <input type="date" id="startDate" className="admin-input" />
                            </div>
                            <div>
                                <label>Bitiş Tarihi</label>
                                <input type="date" id="endDate" className="admin-input" />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isBlocked}
                                        onChange={e => setFormData({ ...formData, isBlocked: e.target.checked })}
                                    />
                                    Tarihleri Kapat (işaretlemezsen açar)
                                </label>
                            </div>
                            {formData.isBlocked && (
                                <div>
                                    <label>Kapatma Nedeni</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.blockReason}
                                        onChange={e => setFormData({ ...formData, blockReason: e.target.value })}
                                        placeholder="Ör: Hava koşulları, bakım..."
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="admin-btn" onClick={handleBulkSubmit}>💾 Uygula</button>
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
            `}</style>
        </div>
    );
}

export default function AvailabilityPage() {
    return (
        <Suspense fallback={<div className="admin-container">Yükleniyor...</div>}>
            <AvailabilityContent />
        </Suspense>
    );
}
