const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Kupon kodu zorunludur'],
        unique: true,
        uppercase: true,
        trim: true
    },
    discount: {
        type: Number,
        required: [true, 'İndirim miktarı zorunludur'],
        min: 0
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    minAmount: {
        type: Number,
        default: 0
    },
    maxUses: {
        type: Number,
        default: null // null = sınırsız
    },
    usedCount: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: [true, 'Geçerlilik tarihi zorunludur']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableActivities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }]
}, {
    timestamps: true
});

// Kupon geçerli mi kontrol et
couponSchema.methods.isValid = function (totalAmount = 0) {
    const now = new Date();

    if (!this.isActive) return { valid: false, message: 'Kupon aktif değil' };
    if (now < this.validFrom) return { valid: false, message: 'Kupon henüz aktif değil' };
    if (now > this.validUntil) return { valid: false, message: 'Kupon süresi dolmuş' };
    if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, message: 'Kupon kullanım limiti dolmuş' };
    if (totalAmount < this.minAmount) return { valid: false, message: `Minimum sepet tutarı: ₺${this.minAmount}` };

    return { valid: true };
};

// İndirim hesapla
couponSchema.methods.calculateDiscount = function (totalAmount) {
    if (this.discountType === 'percentage') {
        return Math.round(totalAmount * (this.discount / 100));
    }
    return Math.min(this.discount, totalAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);
