import mongoose, { Document, Schema } from 'mongoose';

export interface ILanguage extends Document {
    code: string;      // 'tr', 'en', 'de'
    name: string;      // 'Türkçe', 'Deutsch'
    flag: string;      // '🇹🇷', '🇩🇪'
    isActive: boolean;
    isDefault: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const languageSchema = new Schema<ILanguage>({
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    flag: {
        type: String,
        default: '🏳️'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Varsayılan dilin tek olmasını sağlamak için pre-save hook veya logic gerekebilir
// Şimdilik application level'da halledeceğiz.

const Language = mongoose.model<ILanguage>('Language', languageSchema);

export default Language; // Default export
