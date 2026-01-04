'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { value: 'general', labelKey: 'faqCategories.general' },
    { value: 'booking', labelKey: 'faqCategories.booking' },
    { value: 'payment', labelKey: 'faqCategories.payment' },
    { value: 'activity', labelKey: 'faqCategories.activity' },
    { value: 'safety', labelKey: 'faqCategories.safety' }
];

export default function FAQPage() {
    const { language, t } = useLanguage();
    const [faqs, setFaqs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openIndex, setOpenIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFaqs();
    }, [language]);

    const fetchFaqs = async () => {
        try {
            const res = await fetch(`/api/faq?lang=${language}`);
            if (res.ok) {
                const result = await res.json();
                setFaqs(result.data || []);
            }
        } catch (error) {
            console.error('FAQ fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFaqs = selectedCategory === 'all'
        ? faqs
        : faqs.filter(f => f.category === selectedCategory);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Schema.org for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="faq-page">
                <section className="faq-hero">
                    <div className="container">
                        <h1>{t('sections.faq')}</h1>
                        <p>{language === 'tr' ? 'Sık sorulan sorulara hızlı yanıtlar' : 'Quick answers to frequently asked questions'}</p>
                    </div>
                </section>

                <section className="faq-content">
                    <div className="container">
                        {/* Category Filter */}
                        <div className="faq-categories">
                            <button
                                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('all')}
                            >
                                {language === 'tr' ? 'Tümü' : 'All'}
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.value)}
                                >
                                    {t(cat.labelKey)}
                                </button>
                            ))}
                        </div>

                        {/* FAQ List */}
                        {loading ? (
                            <div className="loading">{t('common.loading')}</div>
                        ) : filteredFaqs.length === 0 ? (
                            <div className="no-faqs">
                                {language === 'tr' ? 'Bu kategoride henüz soru yok.' : 'No questions in this category yet.'}
                            </div>
                        ) : (
                            <div className="faq-list">
                                {filteredFaqs.map((faq, index) => (
                                    <div
                                        key={faq._id || index}
                                        className={`faq-item ${openIndex === index ? 'open' : ''}`}
                                    >
                                        <button
                                            className="faq-question"
                                            onClick={() => toggleFaq(index)}
                                        >
                                            <span>{faq.question}</span>
                                            <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                                        </button>
                                        <div className="faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Contact CTA */}
                        <div className="faq-cta">
                            <h3>{language === 'tr' ? 'Sorunuz mu var?' : 'Have a question?'}</h3>
                            <p>{language === 'tr' ? 'Aradığınız cevabı bulamadıysanız bizimle iletişime geçin.' : "If you couldn't find the answer, contact us."}</p>
                            <Link href="/#contact" className="cta-btn">
                                {t('nav.contact')}
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .faq-page {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%);
                }
                .faq-hero {
                    padding: 8rem 1rem 4rem;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
                }
                .faq-hero h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #fff, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .faq-hero p {
                    opacity: 0.8;
                    font-size: 1.1rem;
                }
                .faq-content {
                    padding: 3rem 1rem;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .faq-categories {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    justify-content: center;
                }
                .category-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.05);
                    color: white;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .category-btn.active, .category-btn:hover {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-color: transparent;
                }
                .faq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .faq-item {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .faq-question {
                    width: 100%;
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 1rem;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .faq-question:hover {
                    background: rgba(255,255,255,0.05);
                }
                .faq-icon {
                    font-size: 1.5rem;
                    font-weight: 300;
                    margin-left: 1rem;
                    color: #a855f7;
                }
                .faq-answer {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease, padding 0.3s ease;
                }
                .faq-item.open .faq-answer {
                    max-height: 500px;
                    padding: 0 1.25rem 1.25rem;
                }
                .faq-answer p {
                    opacity: 0.8;
                    line-height: 1.7;
                }
                .loading, .no-faqs {
                    text-align: center;
                    padding: 3rem;
                    opacity: 0.7;
                }
                .faq-cta {
                    text-align: center;
                    margin-top: 4rem;
                    padding: 2rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 16px;
                }
                .faq-cta h3 {
                    margin-bottom: 0.5rem;
                }
                .faq-cta p {
                    opacity: 0.7;
                    margin-bottom: 1.5rem;
                }
                .cta-btn {
                    display: inline-block;
                    padding: 0.75rem 2rem;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: transform 0.2s;
                }
                .cta-btn:hover {
                    transform: translateY(-2px);
                }
                @media (max-width: 768px) {
                    .faq-hero h1 { font-size: 1.8rem; }
                    .faq-hero { padding: 6rem 1rem 2rem; }
                }
            `}</style>
        </>
    );
}
