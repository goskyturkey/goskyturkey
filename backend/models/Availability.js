const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    maxCapacity: {
        type: Number,
        default: 10
    },
    bookedCount: {
        type: Number,
        default: 0
    },
    timeSlots: [{
        time: { type: String, required: true }, // "09:00", "14:00"
        capacity: { type: Number, default: 5 },
        booked: { type: Number, default: 0 }
    }],
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String
    },
    priceModifier: {
        type: Number,
        default: 0 // Yüzdelik fiyat değişikliği (örn: 10 = %10 artış)
    }
}, {
    timestamps: true
});

// Composite index
availabilitySchema.index({ activity: 1, date: 1 }, { unique: true });

// Müsaitlik kontrolü
availabilitySchema.methods.isAvailable = function (time, guests = 1) {
    if (this.isBlocked) return false;

    if (time) {
        const slot = this.timeSlots.find(s => s.time === time);
        if (!slot) return true; // Slot tanımlı değilse varsayılan olarak müsait
        return (slot.capacity - slot.booked) >= guests;
    }

    return (this.maxCapacity - this.bookedCount) >= guests;
};

// Kalan kapasite
availabilitySchema.methods.remainingCapacity = function (time) {
    if (time) {
        const slot = this.timeSlots.find(s => s.time === time);
        if (!slot) return this.maxCapacity;
        return slot.capacity - slot.booked;
    }
    return this.maxCapacity - this.bookedCount;
};

module.exports = mongoose.model('Availability', availabilitySchema);
