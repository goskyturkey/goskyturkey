import { Request, Response, Router } from 'express';
import { generateToken, protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';
import { IUser } from '../types/models';

const router = Router();

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            success: false,
            message: 'Email ve şifre zorunludur'
        });
        return;
    }

    const user = await User.findOne({ email }).select('+password') as IUser | null;

    if (!user) {
        res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre'
        });
        return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre'
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

    const token = generateToken(user._id.toString());

    res.json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, asyncHandler(async (req: Request, res: Response) => {
    res.json({
        success: true,
        user: {
            id: req.user?._id,
            name: req.user?.name,
            email: req.user?.email,
            role: req.user?.role
        }
    });
}));

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', protect, asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400).json({
            success: false,
            message: 'Mevcut ve yeni şifre zorunludur'
        });
        return;
    }

    const user = await User.findById(req.user?._id).select('+password') as IUser | null;

    if (!user) {
        res.status(404).json({
            success: false,
            message: 'Kullanıcı bulunamadı'
        });
        return;
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
        res.status(401).json({
            success: false,
            message: 'Mevcut şifre yanlış'
        });
        return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Şifre başarıyla güncellendi'
    });
}));

export default router;
