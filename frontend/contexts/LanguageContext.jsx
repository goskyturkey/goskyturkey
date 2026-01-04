'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Çeviriler
const translations = {
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
            whyUs: 'Neden GoSky Turkey?',
            gallery: 'Galeri',
            faq: 'Sıkça Sorulan Sorular'
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
            date: 'Tarih',
            notes: 'Notlar',
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
            cta: 'View Tours →'
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
            whyUs: 'Why GoSky Turkey?',
            gallery: 'Gallery',
            faq: 'Frequently Asked Questions'
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
            title: 'Reservation',
            personalInfo: 'Personal Information',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone',
            date: 'Date',
            notes: 'Notes',
            completeReservation: 'Complete Reservation',
            processing: 'Processing...'
        },
        payment: {
            title: 'Payment',
            subtitle: 'Secure payment with iyzico',
            loading: 'Preparing payment...',
            summary: 'Reservation Summary'
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

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('tr');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('goskyLang');
        if (saved) {
            setLanguage(saved);
        } else {
            const browserLang = navigator.language.slice(0, 2);
            setLanguage(browserLang === 'tr' ? 'tr' : 'en');
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('goskyLang', language);
            document.documentElement.lang = language;
        }
    }, [language, mounted]);

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, mounted }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        return { language: 'tr', t: (key) => key, toggleLanguage: () => { }, mounted: false };
    }
    return context;
}

export default LanguageContext;
