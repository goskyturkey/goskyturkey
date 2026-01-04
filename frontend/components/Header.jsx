"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const Header = ({ phone }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { language, toggleLanguage, t } = useLanguage();

    // Format phone for WhatsApp and Tel links
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '905551234567';

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = 'unset';
    };

    return (
        <header className="main-header">
            <Link href="/" className="header-logo" onClick={closeMenu}>
                <Image
                    src="/images/logo.png"
                    alt="GoSky Turkey"
                    width={150}
                    height={40}
                    className="logo-image"
                    priority
                />
            </Link>

            {/* Desktop Navigation */}
            <nav className="header-nav desktop-nav">
                <Link href="/#home">{t('nav.home')}</Link>
                <Link href="/#experiences">{t('nav.experiences')}</Link>
                <Link href="/#why">{t('nav.about')}</Link>
                <Link href="/gallery">{t('nav.gallery')}</Link>
                <Link href="/faq">{t('nav.faq')}</Link>
                <Link href="/#contact">{t('nav.contact')}</Link>
            </nav>

            <div className="header-right">
                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="lang-switcher"
                    title={language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
                >
                    {language === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
                </button>

                <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-icon"
                >
                    💬
                </a>
                <Link href="/#experiences" className="header-cta desktop-cta">
                    {t('nav.reservation')}
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-btn"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            <div className={`mobile-nav-overlay ${isMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav-links">
                    <Link href="/#home" onClick={closeMenu}>{t('nav.home')}</Link>
                    <Link href="/#experiences" onClick={closeMenu}>{t('nav.experiences')}</Link>
                    <Link href="/#why" onClick={closeMenu}>{t('nav.about')}</Link>
                    <Link href="/gallery" onClick={closeMenu}>{t('nav.gallery')}</Link>
                    <Link href="/faq" onClick={closeMenu}>{t('nav.faq')}</Link>
                    <Link href="/#contact" onClick={closeMenu}>{t('nav.contact')}</Link>

                    {/* Mobile Language Switcher */}
                    <button onClick={toggleLanguage} className="mobile-lang-btn">
                        {language === 'tr' ? '🇬🇧 English' : '🇹🇷 Türkçe'}
                    </button>

                    <Link href="/#experiences" className="mobile-cta" onClick={closeMenu}>
                        {t('nav.reservation')}
                    </Link>
                </nav>
            </div>

            <style jsx>{`
                .lang-switcher {
                    background: var(--navy, #1a2744);
                    border: 1px solid var(--navy, #1a2744);
                    color: white;
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    margin-right: 0.5rem;
                }
                .lang-switcher:hover {
                    background: var(--orange, #e8793a);
                    border-color: var(--orange, #e8793a);
                }
                .mobile-lang-btn {
                    background: var(--navy, #1a2744);
                    border: 1px solid var(--navy, #1a2744);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin: 0.5rem 0;
                }
            `}</style>
        </header>
    );
};

export default Header;
