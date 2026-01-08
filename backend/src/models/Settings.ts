import mongoose, { Model, Schema } from 'mongoose';
import { ISettings } from '../types/models.js';

const settingsSchema = new Schema<ISettings>({
    siteName: {
        type: String,
        default: 'GoSkyTurkey'
    },
    siteDescription: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    logo: String,
    favicon: String,
    heroImage: String,
    heroTitle: {
        tr: { type: String, default: 'Türkiye\'nin En Güzel Manzaralarını Keşfedin' },
        en: { type: String, default: 'Discover Turkey\'s Most Beautiful Views' }
    },
    heroSubtitle: {
        tr: { type: String, default: 'Yamaç paraşütü, gyrocopter ve balon turları' },
        en: { type: String, default: 'Paragliding, gyrocopter and balloon tours' }
    },
    contactEmail: String,
    phone: String,
    whatsapp: String,
    mapEmbedUrl: String,
    address: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String
    },
    trustBadges: [{
        icon: String,
        value: String,
        text: {
            tr: String,
            en: String
        }
    }],
    whyUsItems: [{
        tr: String,
        en: String
    }],
    whyUsImage: String,
    testimonials: [{
        name: String,
        location: { tr: String, en: String },
        text: { tr: String, en: String },
        rating: { type: Number, default: 5 }
    }],
    stepperItems: [{
        title: { tr: String, en: String },
        description: { tr: String, en: String }
    }],
    aboutText: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    termsText: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    privacyText: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    seoTitle: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    seoDescription: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    seoKeywords: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    }
}, {
    timestamps: true
});

const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;
