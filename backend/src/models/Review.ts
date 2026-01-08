import mongoose, { Model, Schema } from 'mongoose';
import { IReview } from '../types/models.js';

const reviewSchema = new Schema<IReview>({
    activity: {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: [true, 'Aktivite zorunludur']
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    },
    customerName: {
        type: String,
        required: [true, 'Müşteri adı zorunludur']
    },
    customerEmail: String,
    rating: {
        type: Number,
        required: [true, 'Puan zorunludur'],
        min: [1, 'Puan en az 1 olmalı'],
        max: [5, 'Puan en fazla 5 olmalı']
    },
    title: String,
    comment: {
        type: String,
        required: [true, 'Yorum zorunludur']
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ activity: 1, isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
