import { useLanguages } from '@/hooks/useLanguages';
import { useEffect, useState } from 'react';

// Language Tab Component
export function LangTabs({ active, onChange }) {
    const { languages } = useLanguages();

    // Sort languages: Default (usually TR) first, then by order
    const sortedLanguages = [...languages].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return a.order - b.order;
    });

    return (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {sortedLanguages.map(lang => (
                <button
                    key={lang.code}
                    type="button"
                    onClick={() => onChange(lang.code)}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: active === lang.code ? 'var(--primary, #6366f1)' : '#2d2d44',
                        color: active === lang.code ? '#fff' : '#999',
                        fontWeight: active === lang.code ? 600 : 400,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {lang.isDefault && <span style={{ color: '#ef4444' }}>*</span>}
                </button>
            ))}
        </div>
    );
}

// i18n Input Component
export function I18nInput({ label, value, onChange, type = 'text', required = false, placeholder = '', rows = null }) {
    const { languages } = useLanguages();
    const [activeLang, setActiveLang] = useState('tr'); // Default fallback

    // Set initial active lang to default language when loaded
    useEffect(() => {
        const defaultLang = languages.find(l => l.isDefault);
        if (defaultLang) {
            setActiveLang(defaultLang.code);
        }
    }, [languages]);

    const handleChange = (lang, newValue) => {
        onChange({
            ...value,
            [lang]: newValue
        });
    };

    const InputComponent = rows ? 'textarea' : 'input';
    const currentLang = languages.find(l => l.code === activeLang);
    const isRequiredInCurrentLang = required && currentLang?.isDefault;

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {label} {required && '*'}
            </label>
            <LangTabs active={activeLang} onChange={setActiveLang} />
            <InputComponent
                type={type}
                className="admin-input"
                value={value?.[activeLang] || ''}
                onChange={(e) => handleChange(activeLang, e.target.value)}
                required={isRequiredInCurrentLang}
                placeholder={placeholder}
                rows={rows}
                style={{ width: '100%' }}
            />
            {!currentLang?.isDefault && !value?.[activeLang] && (
                <small style={{ color: '#999', marginTop: '0.25rem', display: 'block' }}>
                    {currentLang?.name} çevirisi opsiyonel. Boş bırakılırsa varsayılan dil gösterilir.
                </small>
            )}
        </div>
    );
}

// i18n Array Input Component
export function I18nArrayInput({ label, value, onChange, placeholder = '' }) {
    const { languages } = useLanguages();
    const [activeLang, setActiveLang] = useState('tr');

    // Set initial active lang
    useEffect(() => {
        const defaultLang = languages.find(l => l.isDefault);
        if (defaultLang) {
            setActiveLang(defaultLang.code);
        }
    }, [languages]);

    const getDisplayValue = (lang) => {
        if (!value || !Array.isArray(value)) return '';
        // Handle both Map-like objects and plain strings if legacy data exists
        return value.map(item => {
            if (typeof item === 'object') return item?.[lang] || '';
            return ''; // or handle legacy string
        }).filter(Boolean).join(', ');
    };

    const handleChange = (lang, inputValue) => {
        const items = inputValue.split(',').map(s => s.trim()).filter(Boolean);
        const currentItems = value || [];

        // Create new array maintaining other language values
        // This logic matches items by index. It's simple but has limitations if lists have different lengths per language.
        // For simple "Includes" lists, it's usually acceptable.

        // Find max length to iterate
        const maxLength = Math.max(items.length, currentItems.length);
        const newValue = [];

        for (let i = 0; i < maxLength; i++) {
            // If we have a new item at this index
            if (i < items.length) {
                const existing = currentItems[i] || {};
                newValue.push({
                    ...existing,
                    [lang]: items[i]
                });
            } else {
                // Item removed in this lang, but might exist in others?
                // If we strictly sync by index, removing from one lang removes the "row".
                // But wait, if I have 3 items in TR and 2 in EN.
                // Editing TR to have 2 items: 3rd item is removed entirely?
                // Or should we keep it?
                // Let's assume sync by index. If user removes from comma list, it removes that "slot".
                // So we don't push anything.
            }
        }

        onChange(newValue);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {label}
            </label>
            <LangTabs active={activeLang} onChange={setActiveLang} />
            <textarea
                className="admin-input"
                value={getDisplayValue(activeLang)}
                onChange={(e) => handleChange(activeLang, e.target.value)}
                placeholder={placeholder}
                rows={3}
                style={{ width: '100%' }}
            />
            <small style={{ color: '#888', marginTop: '0.25rem', display: 'block' }}>
                Virgülle ayırarak yazın (örn: Pilot, Ekipman, Sigorta)
            </small>
        </div>
    );
}
