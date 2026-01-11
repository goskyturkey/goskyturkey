import mongoose, { Model, Schema } from 'mongoose';
import { IFAQ } from '../types/models';

const faqSchema = new Schema<IFAQ>({
    question: {
        type: Map,
        of: String,
        required: [true, 'Soru zorunludur']
    },
    answer: {
        type: Map,
        of: String,
        required: [true, 'Cevap zorunludur']
    },
    category: {
        type: String,
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

// Index for ordering
faqSchema.index({ category: 1, order: 1 });

const FAQ: Model<IFAQ> = mongoose.model<IFAQ>('FAQ', faqSchema);

export default FAQ;
