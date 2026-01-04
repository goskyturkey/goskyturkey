import { useEffect, useState } from 'react';
import api from '../api';
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
            const res = await api.get(`/availability/${activityId}`, {
                params: {
                    month: currentMonth.getMonth() + 1,
                    year: currentMonth.getFullYear()
                }
            });
            setCalendar(res.data.data || []);
        } catch (error) {
            console.error('Calendar fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const goToPrevMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        if (newMonth >= new Date()) {
            setCurrentMonth(newMonth);
        }
    };

    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
    };

    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
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

    // İlk günün haftanın hangi günü olduğunu bul
    const firstDayOfMonth = daysInMonth.length > 0
        ? new Date(daysInMonth[0].date).getDay()
        : 0;

    return (
        <div className="availability-calendar">
            {/* Header */}
            <div className="calendar-header">
                <button onClick={goToPrevMonth} className="nav-btn">←</button>
                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <button onClick={goToNextMonth} className="nav-btn">→</button>
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
