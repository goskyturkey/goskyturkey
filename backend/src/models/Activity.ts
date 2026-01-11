import mongoose, { Model, Schema } from 'mongoose';
import slugify from 'slugify';
import { IActivity } from '../types/models.js';

// Activity schema definition with dynamic i18n support
const activitySchema = new Schema<IActivity>({
    name: {
        type: Map,
        of: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: Map,
        of: String
    },
    shortDescription: {
        type: Map,
        of: String
    },
    location: {
        type: Map,
        of: String
    },
    meetingPoint: {
        type: Map,
        of: String
    },
    duration: {
        type: Map,
        of: String
    },
    category: {
        type: String,
        required: [true, 'Kategori zorunludur'],
        enum: ['paragliding', 'gyrocopter', 'balloon']
    },
    price: {
        type: Number,
        required: [true, 'Fiyat zorunludur'],
        min: [0, 'Fiyat negatif olamaz']
    },
    discountPrice: {
        type: Number,
        min: [0, 'İndirimli fiyat negatif olamaz']
    },
    currency: {
        type: String,
        default: 'TRY',
        enum: ['TRY', 'USD', 'EUR']
    },
    images: [{
        type: String
    }],
    thumbnailImage: {
        type: String
    },
    includes: [{
        type: Map,
        of: String
    }],
    excludes: [{
        type: Map,
        of: String
    }],
    maxParticipants: {
        type: Number,
        default: 10
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    // Dinamik önemli not/uyarı - çok dilli, opsiyonel
    importantNote: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, flattenMaps: true },
    toObject: { virtuals: true, flattenMaps: true }
});

// Slug generation from Turkish name (or any available)
activitySchema.pre('save', function () {
    if (this.isModified('name') || !this.slug) {
        // Map oldugu icin .get() kullanmaliyiz
        const nameMap = this.name as any;
        // Mongoose Map isminde 'get' metodu vardir.
        // Ancak TypeScript, IActivity icindeki 'name' alaninin Map oldugunu henuz bilmiyor olabilir (I18nString guncellendi ama Map type ile uyusmayabilir).
        // Guvenlik icin any cast yapiyoruz veya Map oldugunu varsayiyoruz.

        let nameStr = '';
        if (nameMap instanceof Map) {
            nameStr = nameMap.get('tr') || nameMap.get('en') || Array.from(nameMap.values())[0] || '';
        } else if (typeof nameMap === 'object') {
            // Eger Mixed/Object olarak gelirse
            nameStr = nameMap['tr'] || nameMap['en'] || Object.values(nameMap)[0] || '';
        }

        if (nameStr && typeof nameStr === 'string') {
            this.slug = slugify(nameStr, { lower: true, strict: true });
        }
    }
});

// Virtual for backward compatibility (displayName)
activitySchema.virtual('displayName').get(function () {
    const nameMap = this.name as any;
    if (nameMap instanceof Map) {
        return nameMap.get('tr') || nameMap.get('en') || '';
    }
    return nameMap?.tr || nameMap?.en || '';
});

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
