import { Document, Types } from 'mongoose';

// ============ User Types ============
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============ i18n Types ============
export interface I18nString {
    [key: string]: string | undefined;
}

export interface I18nArrayItem {
    [key: string]: string | undefined;
}

// ============ Activity Types ============
export interface IActivity extends Document {
    _id: Types.ObjectId;
    name: I18nString;
    slug: string;
    description: I18nString;
    shortDescription?: I18nString;
    location: I18nString;
    meetingPoint?: I18nString;
    duration?: I18nString;
    category: 'paragliding' | 'gyrocopter' | 'balloon';
    price: number;
    discountPrice?: number;
    currency: 'TRY' | 'USD' | 'EUR';
    images: string[];
    thumbnailImage?: string;
    includes: I18nArrayItem[];
    excludes: I18nArrayItem[];
    maxParticipants: number;
    isActive: boolean;
    isFeatured: boolean;
    order: number;
    importantNote?: I18nString;
    createdAt: Date;
    updatedAt: Date;
}

// ============ Booking Types ============
export interface IGuest {
    name: string;
    age?: number;
    nationality?: string;
}

export interface IBooking extends Document {
    _id: Types.ObjectId;
    bookingRef: string;
    activity: Types.ObjectId | IActivity;
    activityName: string;
    date: Date;
    time?: string;
    participants: number;
    guests: number;
    guestDetails: IGuest[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerIdentityNumber?: string;
    customerAddress?: string;
    totalPrice: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
    paymentMethod?: string;
    paymentDetails?: {
        method?: string;
        transactionId?: string;
        paidAt?: Date;
        amount?: number;
    };
    notes?: string;
    couponCode?: string;
    discountAmount?: number;
    createdAt: Date;
    updatedAt: Date;
}

// ============ Settings Types ============
export interface ITrustBadge {
    icon: string;
    value: string;
    text: I18nString;
}

export interface ITestimonial {
    name: string;
    location: I18nString;
    text: I18nString;
    rating: number;
}

export interface IStepperItem {
    title: I18nString;
    description: I18nString;
}

export interface ISettings extends Document {
    _id: Types.ObjectId;
    siteName: string;
    siteDescription?: I18nString;
    logo?: string;
    favicon?: string;
    heroImage?: string;
    heroTitle: I18nString;
    heroSubtitle: I18nString;
    contactEmail?: string;
    phone?: string;
    whatsapp?: string;
    mapEmbedUrl?: string;
    address?: I18nString;
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
    };
    trustBadges?: ITrustBadge[];
    whyUsItems?: I18nArrayItem[];
    whyUsImage?: string;
    testimonials?: ITestimonial[];
    stepperItems?: IStepperItem[];
    aboutText?: I18nString;
    termsText?: I18nString;
    privacyText?: I18nString;
    seoTitle?: I18nString;
    seoDescription?: I18nString;
    seoKeywords?: I18nString;
    createdAt: Date;
    updatedAt: Date;
}

// ============ Availability Types ============
export interface ITimeSlot {
    time: string;
    capacity: number;
    booked: number;
}

export interface IAvailability extends Document {
    _id: Types.ObjectId;
    activity: Types.ObjectId | IActivity;
    date: Date;
    maxCapacity: number;
    bookedCount: number;
    timeSlots: ITimeSlot[];
    isBlocked: boolean;
    blockReason?: string;
    isActive: boolean;
}

// ============ Gallery Types ============
export interface IGalleryItem extends Document {
    _id: Types.ObjectId;
    title: I18nString;
    description?: I18nString;
    imageUrl: string;
    thumbnailUrl?: string;
    category: 'paragliding' | 'gyrocopter' | 'balloon' | 'general';
    activity?: Types.ObjectId | IActivity;
    order: number;
    isActive: boolean;
    isFeatured: boolean;
    tags?: string[];
    metadata?: {
        width?: number;
        height?: number;
        size?: number;
        mimeType?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ============ FAQ Types ============
export interface IFAQ extends Document {
    _id: Types.ObjectId;
    question: I18nString;
    answer: I18nString;
    category: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ Coupon Types ============
export interface ICoupon extends Document {
    _id: Types.ObjectId;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit?: number;
    usedCount: number;
    applicableActivities?: Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ Review Types ============
export interface IReview extends Document {
    _id: Types.ObjectId;
    activity: Types.ObjectId | IActivity;
    booking?: Types.ObjectId | IBooking;
    customerName: string;
    customerEmail?: string;
    rating: number;
    title?: string;
    comment: string;
    isApproved: boolean;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}
