const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Başlık zorunludur'],
        maxlength: [100, 'Başlık en fazla 100 karakter olabilir']
    },
    title_en: {
        type: String,
        maxlength: [100, 'English title max 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
    },
    description_en: {
        type: String,
        maxlength: [500, 'English description max 500 characters']
    },
    imageUrl: {
        type: String,
        required: [true, 'Resim URL zorunludur']
    },
    thumbnailUrl: {
        type: String
    },
    category: {
        type: String,
        enum: ['paragliding', 'gyrocopter', 'balloon', 'general'],
        default: 'general'
    },
    activity: {
        type: mongoose.Schema.Types.ObjectId,
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
    tags: [{
        type: String
    }],
    metadata: {
        width: Number,
        height: Number,
        size: Number,
        mimeType: String
    }
}, {
    timestamps: true
});

// İndeksler
galleryItemSchema.index({ category: 1, order: 1 });
galleryItemSchema.index({ isActive: 1, isFeatured: 1 });
galleryItemSchema.index({ activity: 1 });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
