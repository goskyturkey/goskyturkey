import mongoose, { Model, Schema } from 'mongoose';
import { IAvailability, ITimeSlot } from '../types/models';

interface IAvailabilityMethods {
    isAvailable(time?: string, guests?: number): boolean;
    remainingCapacity(time?: string): number;
}

type AvailabilityModel = Model<IAvailability, object, IAvailabilityMethods>;

const timeSlotSchema = new Schema<ITimeSlot>({
    time: { type: String, required: true },
    capacity: { type: Number, default: 10 },
    booked: { type: Number, default: 0 }
}, { _id: false });

const availabilitySchema = new Schema<IAvailability, AvailabilityModel, IAvailabilityMethods>({
    activity: {
        type: Schema.Types.ObjectId,
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
    timeSlots: [timeSlotSchema],
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Composite index
availabilitySchema.index({ activity: 1, date: 1 });

// Check availability
availabilitySchema.methods.isAvailable = function (_time?: string, guests = 1): boolean {
    if (!this.isActive || this.isBlocked) return false;
    return (this.maxCapacity - this.bookedCount) >= guests;
};

// Get remaining capacity
availabilitySchema.methods.remainingCapacity = function (): number {
    return this.maxCapacity - this.bookedCount;
};

const Availability = mongoose.model<IAvailability, AvailabilityModel>('Availability', availabilitySchema);

export default Availability;
