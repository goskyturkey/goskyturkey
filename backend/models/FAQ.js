const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Soru zorunludur'],
        maxlength: [500, 'Soru en fazla 500 karakter olabilir']
    },
    question_en: {
        type: String,
        maxlength: [500, 'Question max 500 characters']
    },
    answer: {
        type: String,
        required: [true, 'Cevap zorunludur'],
        maxlength: [2000, 'Cevap en fazla 2000 karakter olabilir']
    },
    answer_en: {
        type: String,
        maxlength: [2000, 'Answer max 2000 characters']
    },
    category: {
        type: String,
        enum: ['general', 'booking', 'payment', 'activity', 'safety'],
        default: 'general'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isActive: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
