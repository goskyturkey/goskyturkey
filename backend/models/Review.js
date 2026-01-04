const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: [true, 'Aktivite zorunludur']
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    customerName: {
        type: String,
        required: [true, 'İsim zorunludur']
    },
    customerEmail: {
        type: String
    },
    rating: {
        type: Number,
        required: [true, 'Puan zorunludur'],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        maxlength: 100
    },
    comment: {
        type: String,
        required: [true, 'Yorum zorunludur'],
        maxlength: 1000
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Aktivite ortalama puanını güncelle
reviewSchema.statics.calculateAverageRating = async function (activityId) {
    const result = await this.aggregate([
        { $match: { activity: activityId, isApproved: true } },
        {
            $group: {
                _id: '$activity',
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const Activity = require('./Activity');
    if (result.length > 0) {
        await Activity.findByIdAndUpdate(activityId, {
            rating: Math.round(result[0].avgRating * 10) / 10,
            reviewCount: result[0].reviewCount
        });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calculateAverageRating(this.activity);
});

module.exports = mongoose.model('Review', reviewSchema);
