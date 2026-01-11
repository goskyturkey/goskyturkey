export * from './express';
export * from './models';

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
    locale?: string;
    error?: string;
}

// Pagination Types
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenPayload {
    id: string;
    role: string;
    iat: number;
    exp: number;
}

// Booking Request Types
export interface CreateBookingRequest {
    activityId: string;
    activityDate: string;
    activityTime?: string;
    guests: number;
    guestDetails?: Array<{
        name: string;
        age?: number;
        nationality?: string;
    }>;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    couponCode?: string;
    notes?: string;
}
