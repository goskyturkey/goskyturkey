'use client';

import { useEffect, useState } from 'react';
import './AvailabilityCalendar.css';

export default function AvailabilityCalendar({ activityId, onSelectDate, selectedDate }) {
    const [calendar, setCalendar] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailability();
    }, [activityId, currentMonth]);

    const fetchAvailability = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/availability/${activityId}?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`);
            if (res.ok) {
                const result = await res.json();
                setCalendar(result.data || []);
            }
        } catch (error) {
            console.error('Calendar fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const goToPrevMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        const today = new Date();
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        if (newMonth >= today) {
            setCurrentMonth(newMonth);
        }
    };

    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        // Max 6 months ahead
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 6);
        if (newMonth <= maxDate) {
            setCurrentMonth(newMonth);
        }
    };

    // Pazartesi ile başla (Türkiye standardı)
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Sadece mevcut ay günlerini filtrele
    const daysInMonth = calendar.filter(day => {
        const d = new Date(day.date);
        return d.getMonth() === currentMonth.getMonth() &&
            d.getFullYear() === currentMonth.getFullYear();
    });

    // İlk günün haftanın hangi günü olduğunu bul (Pazartesi = 0)
    const getAdjustedDay = (dayIndex) => {
        // JavaScript: Pazar=0, Pazartesi=1, ..., Cumartesi=6
        // Bizim için: Pazartesi=0, Salı=1, ..., Pazar=6
        return dayIndex === 0 ? 6 : dayIndex - 1;
    };
    const firstDayOfMonth = daysInMonth.length > 0
        ? getAdjustedDay(new Date(daysInMonth[0].date).getDay())
        : 0;

    return (
        <div className="availability-calendar">
            {/* Header */}
            <div className="calendar-header">
                <button type="button" onClick={goToPrevMonth} className="nav-btn">←</button>
                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <button type="button" onClick={goToNextMonth} className="nav-btn">→</button>
            </div>

            {/* Day names */}
            <div className="calendar-days-header">
                {dayNames.map(day => (
                    <div key={day} className="day-name">{day}</div>
                ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
                <div className="calendar-loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="calendar-grid">
                    {/* Boş hücreler */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day empty"></div>
                    ))}

                    {/* Günler */}
                    {daysInMonth.map((day) => {
                        const date = new Date(day.date);
                        const isSelected = selectedDate === day.date;
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <button
                                type="button"
                                key={day.date}
                                className={`calendar-day ${day.isAvailable ? 'available' : 'blocked'} ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}`}
                                onClick={() => day.isAvailable && onSelectDate(day.date)}
                                disabled={!day.isAvailable}
                            >
                                <span className="day-number">{date.getDate()}</span>
                                {day.isAvailable && (
                                    <span className={`availability-indicator ${day.remainingCapacity <= 3 ? 'low' : ''}`}>
                                        {day.remainingCapacity <= 3 ? `${day.remainingCapacity} kaldı` : '✓'}
                                    </span>
                                )}
                                {day.priceModifier > 0 && (
                                    <span className="price-modifier">+%{day.priceModifier}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="dot available"></span>
                    Müsait
                </div>
                <div className="legend-item">
                    <span className="dot blocked"></span>
                    Dolu / Kapalı
                </div>
                <div className="legend-item">
                    <span className="dot low"></span>
                    Az Kaldı
                </div>
            </div>
        </div>
    );
}
