'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Fallback çeviriler - 6 dil desteği
const fallbackTranslations = {
    'nav.home': { tr: 'Ana Sayfa', en: 'Home', de: 'Startseite', fr: 'Accueil', hi: 'होम', zh: '首页' },
    'nav.experiences': { tr: 'Deneyimler', en: 'Experiences', de: 'Erlebnisse', fr: 'Expériences', hi: 'अनुभव', zh: '体验' },
    'nav.gallery': { tr: 'Galeri', en: 'Gallery', de: 'Galerie', fr: 'Galerie', hi: 'गैलरी', zh: '图库' },
    'nav.faq': { tr: 'SSS', en: 'FAQ', de: 'FAQ', fr: 'FAQ', hi: 'सवाल', zh: '常见问题' },
    'nav.about': { tr: 'Hakkımızda', en: 'About Us', de: 'Über Uns', fr: 'À Propos', hi: 'हमारे बारे में', zh: '关于我们' },
    'nav.contact': { tr: 'İletişim', en: 'Contact', de: 'Kontakt', fr: 'Contact', hi: 'संपर्क', zh: '联系' },
    'nav.reservation': { tr: 'Rezervasyon', en: 'Book Now', de: 'Jetzt Buchen', fr: 'Réserver', hi: 'बुक करें', zh: '立即预订' },
    'hero.title': {
        tr: "Türkiye'nin En Güzel Manzaralarını Keşfedin",
        en: "Discover Turkey's Most Beautiful Landscapes",
        de: "Entdecken Sie die schönsten Landschaften der Türkei",
        fr: "Découvrez les plus beaux paysages de Turquie",
        hi: "तुर्की के सबसे खूबसूरत नज़ारों की खोज करें",
        zh: "探索土耳其最美丽的风景"
    },
    'hero.subtitle': {
        tr: 'Yamaç paraşütü, gyrocopter ve balon turları ile gökyüzünden eşsiz deneyimler yaşayın.',
        en: 'Experience unique adventures from the sky with paragliding, gyrocopter and balloon tours.',
        de: 'Erleben Sie einzigartige Abenteuer aus der Luft mit Paragliding, Gyrocopter und Ballonfahrten.',
        fr: 'Vivez des aventures uniques depuis le ciel avec le parapente, le gyrocoptère et les vols en montgolfière.',
        hi: 'पैराग्लाइडिंग, जाइरोकॉप्टर और बैलून टूर के साथ आकाश से अनोखे अनुभव लें।',
        zh: '通过滑翔伞、旋翼机和热气球之旅，从天空体验独特的冒险。'
    },
    'hero.cta': { tr: 'Turları İncele →', en: 'View Tours →', de: 'Touren ansehen →', fr: 'Voir les excursions →', hi: 'टूर देखें →', zh: '查看行程 →' },
    'sections.popularExperiences': { tr: 'Popüler Deneyimler', en: 'Popular Experiences', de: 'Beliebte Erlebnisse', fr: 'Expériences Populaires', hi: 'लोकप्रिय अनुभव', zh: '热门体验' },
    'sections.popularSubtitle': { tr: 'En çok tercih edilen turlarımız', en: 'Our most preferred tours', de: 'Unsere beliebtesten Touren', fr: 'Nos circuits les plus populaires', hi: 'हमारे सबसे पसंदीदा टूर', zh: '我们最受欢迎的行程' },
    'sections.whyUs': { tr: 'Neden Bizi Seçmelisiniz?', en: 'Why Choose Us?', de: 'Warum wir?', fr: 'Pourquoi nous choisir ?', hi: 'हमें क्यों चुनें?', zh: '为什么选择我们？' },
    'activity.bookNow': { tr: 'Hemen Rezervasyon →', en: 'Book Now →', de: 'Jetzt Buchen →', fr: 'Réserver →', hi: 'अभी बुक करें →', zh: '立即预订 →' },
    'common.loading': { tr: 'Yükleniyor...', en: 'Loading...', de: 'Laden...', fr: 'Chargement...', hi: 'लोड हो रहा है...', zh: '加载中...' },
    'common.error': { tr: 'Hata', en: 'Error', de: 'Fehler', fr: 'Erreur', hi: 'त्रुटि', zh: '错误' },
    'footer.rights': { tr: 'Tüm hakları saklıdır.', en: 'All rights reserved.', de: 'Alle Rechte vorbehalten.', fr: 'Tous droits réservés.', hi: 'सभी अधिकार सुरक्षित।', zh: '版权所有。' }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('tr');
    const [languages, setLanguages] = useState([
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'zh', name: '中文', flag: '🇨🇳' }
    ]);
    const [translations, setTranslations] = useState({});
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Dilleri API'den çek
    const fetchLanguages = useCallback(async () => {
        try {
            const res = await fetch('/api/languages');
            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    setLanguages(data.data.map(l => ({
                        code: l.code,
                        name: l.name,
                        flag: l.flag
                    })));
                }
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
        }
    }, []);

    // Çevirileri API'den çek
    const fetchTranslations = useCallback(async (lang) => {
        try {
            const res = await fetch(`/api/translations/${lang}`);
            if (res.ok) {
                const data = await res.json();
                setTranslations(prev => ({
                    ...prev,
                    [lang]: data.data || {}
                }));
            }
        } catch (error) {
            console.error('Error fetching translations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // İlk yükleme
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('goskyLang');
        if (saved && ['tr', 'en', 'de', 'fr', 'hi', 'zh'].includes(saved)) {
            setLanguage(saved);
        } else {
            const browserLang = navigator.language.slice(0, 2);
            setLanguage(browserLang === 'tr' ? 'tr' : 'en');
        }
        fetchLanguages();
    }, [fetchLanguages]);

    // Dil değiştiğinde çevirileri yükle
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('goskyLang', language);
            document.documentElement.lang = language;

            // Çeviriler yüklü değilse API'den çek
            if (!translations[language]) {
                fetchTranslations(language);
            }
        }
    }, [language, mounted, translations, fetchTranslations]);

    // Çeviri fonksiyonu - API'den veya fallback'ten al
    const t = useCallback((key) => {
        // Önce API'den gelen çevirilere bak
        if (translations[language] && translations[language][key]) {
            return translations[language][key];
        }

        // Fallback çevirilere bak
        if (fallbackTranslations[key]) {
            return fallbackTranslations[key][language] || fallbackTranslations[key]['tr'] || key;
        }

        // Hiçbiri yoksa key'i döndür
        return key;
    }, [language, translations]);

    // Eski nested key yapısı için uyumluluk (nav.home, hero.title vs)
    const tNested = useCallback((keyPath) => {
        // Önce flat key olarak dene
        const flatResult = t(keyPath);
        if (flatResult !== keyPath) {
            return flatResult;
        }

        // Eski nested translations için fallback
        const keys = keyPath.split('.');
        let value = oldTranslations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || keyPath;
    }, [t, language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
    };

    // Çevirileri yenile
    const refreshTranslations = useCallback(() => {
        setTranslations({});
        fetchTranslations(language);
    }, [fetchTranslations, language]);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            languages,
            toggleLanguage,
            t: tNested,
            mounted,
            isLoading,
            refreshTranslations
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'tr',
            languages: [],
            t: (key) => key,
            toggleLanguage: () => { },
            mounted: false,
            isLoading: true
        };
    }
    return context;
}

// Eski hardcoded çeviriler - uyumluluk için korunuyor
const oldTranslations = {
    tr: {
        nav: {
            home: 'Ana Sayfa',
            experiences: 'Deneyimler',
            gallery: 'Galeri',
            faq: 'SSS',
            about: 'Hakkımızda',
            contact: 'İletişim',
            reservation: 'Rezervasyon'
        },
        hero: {
            title: "Türkiye'nin En Güzel Manzaralarını Keşfedin",
            subtitle: 'Yamaç paraşütü, gyrocopter ve balon turları ile gökyüzünden eşsiz deneyimler yaşayın.',
            cta: 'Turları İncele →'
        },
        trust: {
            licensed: 'TÜRSAB Lisanslı',
            years: 'Yıl Deneyim',
            guests: 'Mutlu Misafir',
            rating: 'Ortalama Puan'
        },
        sections: {
            popularExperiences: 'Popüler Deneyimler',
            popularSubtitle: 'Sizin için en iyi macera turlarını seçtik',
            whyUs: 'Neden GoSkyTurkey?',
            howItWorks: 'Nasıl Çalışır?',
            testimonials: 'Misafirlerimiz Ne Diyor?',
            contact: 'İletişim',
            gallery: 'Galeri',
            faq: 'Sıkça Sorulan Sorular'
        },
        stepper: {
            subtitle: '4 kolay adımda maceranızı ayırtın'
        },
        testimonials: {
            subtitle: 'Mutlu misafirlerimizin yorumlarını okuyun'
        },
        contact: {
            visitUs: 'Bizi ziyaret edin veya iletişime geçin',
            address: 'Adres',
            phone: 'Telefon'
        },
        activity: {
            bookNow: 'Rezervasyon Yap',
            perPerson: '/ kişi',
            duration: 'Süre',
            location: 'Konum',
            included: 'Dahil Olanlar',
            excluded: 'Dahil Olmayanlar',
            totalPrice: 'Toplam',
            guests: 'Kişi Sayısı'
        },
        booking: {
            title: 'Rezervasyon',
            personalInfo: 'Kişisel Bilgiler',
            fullName: 'Ad Soyad',
            email: 'Email',
            phone: 'Telefon',
            identityNumber: 'T.C. Kimlik / Pasaport No',
            date: 'Tarih',
            notes: 'Notlar',
            details: 'Rezervasyon Detayları',
            selectDate: 'Tarih Seçin',
            person: 'kişi',
            total: 'Toplam',
            perPerson: 'kişi başı',
            proceedToPayment: 'Ödemeye Geç',
            back: 'Tura Geri Dön',
            completeReservation: 'Rezervasyonu Tamamla',
            processing: 'İşleniyor...'
        },
        payment: {
            title: 'Ödeme',
            subtitle: 'iyzico güvenli ödeme altyapısı',
            loading: 'Ödeme hazırlanıyor...',
            summary: 'Rezervasyon Özeti'
        },
        result: {
            success: 'Rezervasyonunuz Alındı! 🎉',
            successDesc: 'Ödemeniz başarıyla tamamlandı.',
            failed: 'Ödeme Başarısız 😔',
            failedDesc: 'Lütfen tekrar deneyin.',
            backToHome: 'Ana Sayfaya Dön'
        },
        footer: {
            rights: 'Tüm hakları saklıdır.'
        },
        faqCategories: {
            general: 'Genel',
            booking: 'Rezervasyon',
            payment: 'Ödeme',
            activity: 'Aktivite',
            safety: 'Güvenlik'
        },
        common: {
            loading: 'Yükleniyor...',
            error: 'Hata'
        },
        gallery: {
            title: 'Galeri',
            subtitle: 'Unutulmaz anlardan kareler',
            noItems: 'Bu kategoride henüz resim yok.'
        }
    },
    en: {
        nav: {
            home: 'Home',
            experiences: 'Experiences',
            gallery: 'Gallery',
            faq: 'FAQ',
            about: 'About Us',
            contact: 'Contact',
            reservation: 'Book Now'
        },
        hero: {
            title: "Discover Turkey's Most Beautiful Landscapes",
            subtitle: 'Experience unique adventures from the sky with paragliding, gyrocopter and balloon tours.',
            cta: 'Explore Tours →'
        },
        trust: {
            licensed: 'TÜRSAB Licensed',
            years: 'Years Experience',
            guests: 'Happy Guests',
            rating: 'Average Rating'
        },
        sections: {
            popularExperiences: 'Popular Experiences',
            popularSubtitle: 'We selected the best adventure tours for you',
            whyUs: 'Why GoSkyTurkey?',
            howItWorks: 'How It Works',
            testimonials: 'What Our Guests Say',
            contact: 'Contact Us',
            gallery: 'Gallery',
            faq: 'Frequently Asked Questions'
        },
        stepper: {
            subtitle: 'Book your adventure in 4 easy steps'
        },
        testimonials: {
            subtitle: 'Read reviews from our happy guests'
        },
        contact: {
            visitUs: 'Visit us or get in touch',
            address: 'Address',
            phone: 'Phone'
        },
        activity: {
            bookNow: 'Book Now',
            perPerson: '/ person',
            duration: 'Duration',
            location: 'Location',
            included: 'Included',
            excluded: 'Not Included',
            totalPrice: 'Total',
            guests: 'Number of Guests'
        },
        booking: {
            title: 'Booking',
            personalInfo: 'Personal Information',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone',
            identityNumber: 'ID / Passport Number',
            date: 'Date',
            notes: 'Notes',
            details: 'Booking Details',
            selectDate: 'Select Date',
            person: 'person',
            total: 'Total',
            perPerson: 'per person',
            proceedToPayment: 'Proceed to Payment',
            back: 'Back to Tour',
            completeReservation: 'Complete Reservation',
            processing: 'Processing...'
        },
        payment: {
            title: 'Payment',
            subtitle: 'iyzico secure payment',
            loading: 'Preparing payment...',
            summary: 'Booking Summary'
        },
        result: {
            success: 'Reservation Confirmed! 🎉',
            successDesc: 'Your payment was successful.',
            failed: 'Payment Failed 😔',
            failedDesc: 'Please try again.',
            backToHome: 'Back to Home'
        },
        footer: {
            rights: 'All rights reserved.'
        },
        faqCategories: {
            general: 'General',
            booking: 'Booking',
            payment: 'Payment',
            activity: 'Activity',
            safety: 'Safety'
        },
        common: {
            loading: 'Loading...',
            error: 'Error'
        },
        gallery: {
            title: 'Gallery',
            subtitle: 'Unforgettable moments captured',
            noItems: 'No images in this category yet.'
        }
    }
};

export default LanguageContext;
