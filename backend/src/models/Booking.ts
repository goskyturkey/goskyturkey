import mongoose, { Model, Schema } from 'mongoose';
import { IBooking } from '../types/models.js';

const bookingSchema = new Schema<IBooking>({
    bookingRef: {
        type: String,
        unique: true
    },
    activity: {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: [true, 'Aktivite zorunludur']
    },
    activityName: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: [true, 'Tarih zorunludur']
    },
    time: String,
    participants: {
        type: Number,
        default: 1,
        min: [1, 'En az 1 kişi olmalı']
    },
    guests: {
        type: Number,
        required: [true, 'Kişi sayısı zorunludur'],
        min: [1, 'En az 1 kişi olmalı']
    },
    guestDetails: [{
        name: String,
        age: Number,
        nationality: String
    }],
    customerName: {
        type: String,
        required: [true, 'Müşteri adı zorunludur']
    },
    customerEmail: {
        type: String,
        required: [true, 'Email zorunludur'],
        match: [/^\S+@\S+\.\S+$/, 'Geçerli bir email giriniz']
    },
    customerPhone: {
        type: String,
        required: [true, 'Telefon zorunludur']
    },
    customerIdentityNumber: {
        type: String,
        default: ''
    },
    customerAddress: {
        type: String,
        default: ''
    },
    totalPrice: {
        type: Number,
        required: [true, 'Toplam fiyat zorunludur']
    },
    currency: {
        type: String,
        default: 'TRY'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    paymentDetails: {
        method: String,
        transactionId: String,
        paidAt: Date,
        amount: Number,
        conversationId: String,
        token: String,
        paymentTransactionId: String,
        cardFamily: String,
        cardType: String,
        lastFourDigits: String,
        errorCode: String,
        errorMessage: String
    },
    notes: String,
    couponCode: String,
    discountAmount: Number
}, {
    timestamps: true
});

// Generate booking reference
bookingSchema.pre('save', function () {
    if (!this.bookingRef) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingRef = `GST-${timestamp}-${random}`;
    }
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
