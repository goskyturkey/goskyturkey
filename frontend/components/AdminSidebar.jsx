'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Menü grupları
const menuGroups = [
    {
        title: null,
        items: [
            { href: '/admin', label: 'Dashboard', icon: '📊', exact: true }
        ]
    },
    {
        title: 'İçerik',
        items: [
            { href: '/admin/activities', label: 'Turlar & Aktiviteler', icon: '🎈' },
            { href: '/admin/availability', label: 'Müsaitlik Takvimi', icon: '📅' },
            { href: '/admin/bookings', label: 'Rezervasyonlar', icon: '📋' },
            { href: '/admin/gallery', label: 'Galeri', icon: '🖼️' }
        ]
    },
    {
        title: 'Site',
        items: [
            { href: '/admin/faq', label: 'SSS', icon: '❓' },
            { href: '/admin/reviews', label: 'Yorumlar', icon: '⭐' },
            { href: '/admin/coupons', label: 'Kuponlar', icon: '🎟️' }
        ]
    },
    {
        title: 'Dil & SEO',
        items: [
            { href: '/admin/languages', label: 'Diller', icon: '🌍' },
            { href: '/admin/translations', label: 'Çeviriler', icon: '🌐' }
        ]
    },
    {
        title: 'Sistem',
        items: [
            { href: '/admin/settings', label: 'Ayarlar', icon: '⚙️' },
            { href: '/admin/analytics', label: 'Analytics', icon: '📈' }
        ]
    }
];

export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (href, exact = false) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    if (!mounted) return null;

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="sidebar-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Menüyü aç/kapat"
            >
                {isMobileOpen ? '✕' : '☰'}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileOpen ? 'admin-sidebar--open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <span className="sidebar-logo__icon">🎈</span>
                    <span className="sidebar-logo__text">GoSkyTurkey</span>
                    <span className="sidebar-logo__badge">Admin</span>
                </div>

                {/* Menu Groups */}
                <nav className="sidebar-nav">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="sidebar-group">
                            {group.title && (
                                <div className="sidebar-group__title">{group.title}</div>
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-item ${isActive(item.href, item.exact) ? 'sidebar-item--active' : ''}`}
                                    onClick={() => setIsMobileOpen(false)}
                                >
                                    <span className="sidebar-item__icon">{item.icon}</span>
                                    <span className="sidebar-item__label">{item.label}</span>
                                    {isActive(item.href, item.exact) && (
                                        <div className="sidebar-item__indicator" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user__avatar">👤</div>
                        <div className="sidebar-user__info">
                            <div className="sidebar-user__name">{user?.name || 'Admin'}</div>
                            <div className="sidebar-user__role">Yönetici</div>
                        </div>
                    </div>
                    <button onClick={logout} className="sidebar-logout">
                        <span>🚪</span>
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
