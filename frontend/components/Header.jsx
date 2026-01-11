"use client";
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const Header = ({ phone, logo, whatsapp }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { language, toggleLanguage, t } = useLanguage();

    // Format phone for WhatsApp and Tel links
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '905551234567';
    // Use explicit whatsapp number from settings if available, otherwise use phone
    const whatsappNumber = whatsapp ? whatsapp.replace(/\D/g, '') : cleanPhone;

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
                    src={logo ? (logo.startsWith('/') ? logo : `/${logo}`) : "/images/logo.webp"}
                    alt="GoSkyTurkey"
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
                {/* Language Selector Dropdown */}
                <LanguageSelector />

                <a
                    href={`https://wa.me/${whatsappNumber}`}
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

                    {/* Mobile Language Selector */}
                    <LanguageSelector variant="mobile" />

                    <Link href="/#experiences" className="mobile-cta" onClick={closeMenu}>
                        {t('nav.reservation')}
                    </Link>
                </nav>
            </div>

        </header>
    );
};

export default Header;
