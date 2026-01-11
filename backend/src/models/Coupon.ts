import mongoose, { Model, Schema } from 'mongoose';
import { ICoupon } from '../types/models';

interface ICouponMethods {
    isValid(totalAmount?: number): { valid: boolean; message?: string };
    calculateDiscount(totalAmount: number): number;
}

type CouponModel = Model<ICoupon, object, ICouponMethods>;

const couponSchema = new Schema<ICoupon, CouponModel, ICouponMethods>({
    code: {
        type: String,
        required: [true, 'Kupon kodu zorunludur'],
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: [true, 'İndirim miktarı zorunludur'],
        min: 0
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    maxDiscount: Number,
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: [true, 'Geçerlilik tarihi zorunludur']
    },
    usageLimit: Number,
    usedCount: {
        type: Number,
        default: 0
    },
    applicableActivities: [{
        type: Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Check if coupon is valid
couponSchema.methods.isValid = function (totalAmount = 0): { valid: boolean; message?: string } {
    const now = new Date();

    if (!this.isActive) return { valid: false, message: 'Kupon aktif değil' };
    if (now < this.validFrom) return { valid: false, message: 'Kupon henüz aktif değil' };
    if (now > this.validUntil) return { valid: false, message: 'Kupon süresi dolmuş' };
    if (this.usageLimit && this.usedCount >= this.usageLimit) {
        return { valid: false, message: 'Kupon kullanım limiti dolmuş' };
    }
    if (this.minPurchase && totalAmount < this.minPurchase) {
        return { valid: false, message: `Minimum sepet tutarı: ₺${this.minPurchase}` };
    }

    return { valid: true };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (totalAmount: number): number {
    let discount: number;

    if (this.discountType === 'percentage') {
        discount = Math.round(totalAmount * (this.discountValue / 100));
    } else {
        discount = this.discountValue;
    }

    if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
    }

    return Math.min(discount, totalAmount);
};

const Coupon = mongoose.model<ICoupon, CouponModel>('Coupon', couponSchema);

export default Coupon;
