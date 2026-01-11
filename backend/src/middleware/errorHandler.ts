import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

// Custom API Error class
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Async handler wrapper to avoid try-catch blocks in routes
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
    res.status(404).json({
        success: false,
        message: `Kaynak bulunamadı: ${req.originalUrl}`
    });
};

// Interface for Mongoose validation errors
interface MongooseValidationError {
    errors: Record<string, { message: string }>;
}

interface MongooseDuplicateKeyError {
    code: number;
    keyValue: Record<string, unknown>;
}

// Centralized error handler
export const errorHandler = (
    err: Error | ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Sunucu hatası';

    // Handle our custom ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const validationError = err as unknown as MongooseValidationError;
        const messages = Object.values(validationError.errors).map(e => e.message);
        message = messages.join(', ');
    }

    // Handle Mongoose duplicate key error
    const errWithCode = err as unknown as MongooseDuplicateKeyError;
    if (errWithCode.code === 11000) {
        statusCode = 400;
        const field = Object.keys(errWithCode.keyValue)[0];
        message = `Bu ${field} zaten kullanılıyor`;
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Geçersiz ID formatı';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Geçersiz token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token süresi dolmuş';
    }

    // Log the error
    logger.error(`${statusCode} - ${message}`, {
        error: err.message,
        stack: err.stack
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
