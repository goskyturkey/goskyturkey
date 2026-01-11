import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/models';

interface TokenPayload extends JwtPayload {
    id: string;
}

// JWT Token generation
export const generateToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({ id }, secret, {
        expiresIn: '7d'
    } as jwt.SignOptions);
};

// Auth middleware - for protected routes
export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Bu işlem için giriş yapmanız gerekiyor'
        });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, secret) as TokenPayload;
        const user = await User.findById(decoded.id) as IUser | null;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

// Admin check middleware
export const adminOnly = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Bu işlem için admin yetkisi gerekiyor'
        });
        return;
    }
    next();
};
