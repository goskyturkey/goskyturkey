'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function LanguageSelector({ variant = 'desktop' }) {
    const { language, setLanguage, languages, mounted } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const pathname = usePathname();
    const router = useRouter();

    // URL'deki locale'i algıla ve context ile senkronize et
    useEffect(() => {
        if (mounted && pathname) {
            const urlLocale = pathname.split('/')[1];
            if (['tr', 'en', 'de', 'fr', 'hi', 'zh'].includes(urlLocale) && urlLocale !== language) {
                setLanguage(urlLocale);
            }
        }
    }, [pathname, mounted]);

    // Mevcut dili bul
    const currentLang = languages.find(l => l.code === language) || {
        code: language,
        name: language.toUpperCase(),
        flag: '🌐'
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Escape key to close
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleSelect = (langCode) => {
        // Context'i güncelle
        setLanguage(langCode);
        setIsOpen(false);

        // URL'i değiştir - locale segmentini yeni dil ile değiştir
        if (pathname) {
            const segments = pathname.split('/');
            const currentLocale = segments[1];

            // Eğer mevcut locale geçerli bir dil kodu ise değiştir
            if (['tr', 'en', 'de', 'fr', 'hi', 'zh'].includes(currentLocale)) {
                segments[1] = langCode;
                const newPath = segments.join('/');
                router.push(newPath);
            } else {
                // Locale yok, başına ekle
                router.push(`/${langCode}${pathname}`);
            }
        }
    };

    const isMobile = variant === 'mobile';

    // Loading state
    if (!mounted) {
        return (
            <div className="lang-selector">
                <button className="lang-trigger lang-trigger--loading">
                    <span className="lang-trigger__flag">🌐</span>
                </button>
            </div>
        );
    }

    return (
        <div
            className={`lang-selector ${isMobile ? 'lang-selector--mobile' : ''}`}
            ref={dropdownRef}
        >
            {/* Trigger Button */}
            <button
                className={`lang-trigger ${isOpen ? 'lang-trigger--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Dil seçin"
            >
                <span className="lang-trigger__flag">{currentLang.flag}</span>
                <span className="lang-trigger__code">{currentLang.code?.toUpperCase() || 'TR'}</span>
                <svg
                    className={`lang-trigger__arrow ${isOpen ? 'lang-trigger__arrow--open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                >
                    <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            <div className={`lang-dropdown ${isOpen ? 'lang-dropdown--open' : ''}`} role="listbox">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        className={`lang-option ${lang.code === language ? 'lang-option--active' : ''}`}
                        onClick={() => handleSelect(lang.code)}
                        role="option"
                        aria-selected={lang.code === language}
                    >
                        <span className="lang-option__flag">{lang.flag}</span>
                        <span className="lang-option__name">{lang.name}</span>
                        {lang.code === language && (
                            <svg className="lang-option__check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>

            <style jsx>{`
                .lang-selector {
                    position: relative;
                    z-index: 50;
                }

                .lang-trigger {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #1a2744 0%, #2d3a52 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .lang-trigger:hover {
                    background: linear-gradient(135deg, #2d3a52 0%, #3d4a62 100%);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .lang-trigger--open {
                    background: linear-gradient(135deg, #e8793a 0%, #d96a2d 100%);
                    border-color: transparent;
                }

                .lang-trigger--loading {
                    opacity: 0.7;
                    cursor: wait;
                }

                .lang-trigger__flag {
                    font-size: 18px;
                    line-height: 1;
                }

                .lang-trigger__code {
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .lang-trigger__arrow {
                    transition: transform 0.2s ease;
                    opacity: 0.8;
                }

                .lang-trigger__arrow--open {
                    transform: rotate(180deg);
                }

                .lang-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 160px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px) scale(0.95);
                    transition: all 0.2s ease;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                }

                .lang-dropdown--open {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0) scale(1);
                }

                .lang-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: #1a2744;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: left;
                }

                .lang-option:hover {
                    background: #f8f9fa;
                }

                .lang-option--active {
                    background: linear-gradient(135deg, rgba(232, 121, 58, 0.1) 0%, rgba(232, 121, 58, 0.05) 100%);
                    color: #e8793a;
                }

                .lang-option--active:hover {
                    background: linear-gradient(135deg, rgba(232, 121, 58, 0.15) 0%, rgba(232, 121, 58, 0.1) 100%);
                }

                .lang-option__flag {
                    font-size: 20px;
                    line-height: 1;
                }

                .lang-option__name {
                    flex: 1;
                }

                .lang-option__check {
                    color: #e8793a;
                }

                /* Mobile variant */
                .lang-selector--mobile .lang-trigger {
                    padding: 12px 20px;
                    font-size: 16px;
                    border-radius: 12px;
                    gap: 10px;
                }

                .lang-selector--mobile .lang-trigger__flag {
                    font-size: 22px;
                }

                .lang-selector--mobile .lang-dropdown {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    right: auto;
                    transform: translate(-50%, -50%) scale(0.9);
                    min-width: 280px;
                    border-radius: 16px;
                }

                .lang-selector--mobile .lang-dropdown--open {
                    transform: translate(-50%, -50%) scale(1);
                }

                .lang-selector--mobile .lang-option {
                    padding: 16px 20px;
                    font-size: 16px;
                }

                .lang-selector--mobile .lang-option__flag {
                    font-size: 24px;
                }
            `}</style>
        </div>
    );
}
