import mongoose, { Document, Schema } from 'mongoose';

export interface ITranslation extends Document {
    key: string;           // 'nav.home', 'hero.title', etc.
    category: string;      // 'navigation', 'hero', 'footer', etc.
    translations: Map<string, string>;  // { tr: "Ana Sayfa", en: "Home", de: "Startseite" }
    description?: string;  // Admin için açıklama
    isSystem: boolean;     // Sistem çevirisi mi (silinmemeli)
    createdAt: Date;
    updatedAt: Date;
}

const translationSchema = new Schema<ITranslation>({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        enum: ['navigation', 'hero', 'footer', 'booking', 'activity', 'payment', 'error', 'common', 'gallery', 'faq', 'seo'],
        index: true
    },
    translations: {
        type: Map,
        of: String,
        default: new Map()
    },
    description: {
        type: String,
        default: ''
    },
    isSystem: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Çeviri getir - fallback to Turkish, then key
translationSchema.methods.getTranslation = function (lang: string): string {
    const translations = this.translations as Map<string, string>;
    return translations.get(lang) || translations.get('tr') || this.key;
};

// Bulk update için static method
translationSchema.statics.bulkUpdateTranslations = async function (
    updates: Array<{ key: string; lang: string; value: string }>
) {
    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { key: update.key },
            update: { $set: { [`translations.${update.lang}`]: update.value } }
        }
    }));
    return this.bulkWrite(bulkOps);
};

const Translation = mongoose.model<ITranslation>('Translation', translationSchema);

export default Translation;
