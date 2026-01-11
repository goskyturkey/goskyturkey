import mongoose, { Model, Schema } from 'mongoose';
import { IGalleryItem } from '../types/models';

const galleryItemSchema = new Schema<IGalleryItem>({
    title: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    description: {
        tr: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    imageUrl: {
        type: String,
        required: [true, 'Resim URL zorunludur']
    },
    thumbnailUrl: String,
    category: {
        type: String,
        enum: ['paragliding', 'gyrocopter', 'balloon', 'general'],
        default: 'general'
    },
    activity: {
        type: Schema.Types.ObjectId,
        ref: 'Activity'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [String],
    metadata: {
        width: Number,
        height: Number,
        size: Number,
        mimeType: String
    }
}, {
    timestamps: true
});

// Virtual for backward compatibility
galleryItemSchema.virtual('displayTitle').get(function () {
    return this.title?.tr || this.title?.en || '';
});

galleryItemSchema.set('toJSON', { virtuals: true });
galleryItemSchema.set('toObject', { virtuals: true });

// Indexes
galleryItemSchema.index({ category: 1, order: 1 });
galleryItemSchema.index({ isActive: 1, isFeatured: 1 });

const GalleryItem: Model<IGalleryItem> = mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema);

export default GalleryItem;
