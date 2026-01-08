'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

const Footer = ({ siteName, phone }) => {
    const { t, language } = useLanguage();
    const displayPhone = phone || '+90 555 123 4567';
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : '+905551234567';
    const name = siteName || 'GoSkyTurkey';

    const socialLinks = [
        { href: 'https://www.youtube.com/@GoSkyTurkey', icon: '📺', label: 'YouTube' },
        { href: 'https://www.instagram.com/goskyturkey/', icon: '📸', label: 'Instagram' },
        { href: 'https://x.com/GoSkyTurkey', icon: '𝕏', label: 'X' },
        { href: 'https://www.facebook.com/GoSkyTurkey/', icon: '👍', label: 'Facebook' },
    ];

    return (
        <footer className="main-footer">
            <div className="footer-logo">✈️ {name}</div>
            <div className="footer-links">
                <Link href={`/${language}#home`}>{t('nav.home')}</Link>
                <Link href={`/${language}#experiences`}>{t('nav.experiences')}</Link>
                <Link href={`/${language}#why`}>{t('nav.about')}</Link>
                <a href={`tel:${cleanPhone}`}>📞 {displayPhone}</a>
            </div>
            <div className="footer-social">
                {socialLinks.map((social) => (
                    <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.label}
                        aria-label={social.label}
                    >
                        {social.icon}
                    </a>
                ))}
            </div>
            <div className="footer-copyright">
                © {new Date().getFullYear()} {name}. {t('footer.rights')}
            </div>
        </footer>
    );
};

export default Footer;
