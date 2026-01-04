'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import './LanguageSelector.css';

export default function LanguageSelector() {
    const { language, toggleLanguage, mounted } = useLanguage();

    if (!mounted) {
        return <button className="lang-btn">🌐</button>;
    }

    return (
        <button className="lang-btn" onClick={toggleLanguage} title="Dil Değiştir">
            {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </button>
    );
}
