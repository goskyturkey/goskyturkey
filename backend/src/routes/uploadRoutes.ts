import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { adminOnly, protect } from '../middleware/auth';

const router = Router();

// Upload directories
const uploadDir = path.join(process.cwd(), 'uploads');
const tempDir = path.join(uploadDir, 'temp');

// Ensure directories exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Disk storage to avoid memory exhaustion (DoS prevention)
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tempDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Sadece resim dosyaları yüklenebilir!'));
};

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter
});

// Process image from disk and convert to WebP
async function processImageFromDisk(
    tempPath: string,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    } = {}
): Promise<{ finalPath: string; filename: string; size: number }> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;

    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const filename = `${uniqueSuffix}.webp`;
    const finalPath = path.join(uploadDir, filename);

    await sharp(tempPath)
        .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality })
        .toFile(finalPath);

    // Get file size
    const stats = await fs.promises.stat(finalPath);

    // Delete temp file
    await fs.promises.unlink(tempPath).catch(() => { /* ignore */ });

    return { finalPath, filename, size: stats.size };
}

// Single file upload - auto WebP conversion
router.post('/upload', protect, adminOnly, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        const { filename, size } = await processImageFromDisk(req.file.path, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85
        });

        const fileUrl = `/uploads/${filename}`;

        res.json({
            success: true,
            data: {
                filename,
                url: fileUrl,
                originalName: req.file.originalname,
                format: 'webp',
                size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up temp file on error
        if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => { /* ignore */ });
        }
        res.status(500).json({
            success: false,
            message: 'Dosya yüklenemedi'
        });
    }
});

// Hero image endpoint - larger size
router.post('/upload/hero', protect, adminOnly, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        const { filename, size } = await processImageFromDisk(req.file.path, {
            maxWidth: 2560,
            maxHeight: 1440,
            quality: 90
        });

        const fileUrl = `/uploads/${filename}`;

        res.json({
            success: true,
            data: {
                filename,
                url: fileUrl,
                originalName: req.file.originalname,
                format: 'webp',
                size
            }
        });
    } catch (error) {
        console.error('Hero upload error:', error);
        if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => { /* ignore */ });
        }
        res.status(500).json({
            success: false,
            message: 'Hero görseli yüklenemedi'
        });
    }
});

// Multiple file upload
router.post('/upload/multiple', protect, adminOnly, upload.array('files', 10), async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    try {
        if (!files.length) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        const results = await Promise.all(
            files.map(async (file) => {
                const { filename } = await processImageFromDisk(file.path);
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    originalName: file.originalname
                };
            })
        );

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        // Clean up all temp files on error
        await Promise.all(
            files.map(f => fs.promises.unlink(f.path).catch(() => { /* ignore */ }))
        );
        res.status(500).json({
            success: false,
            message: 'Dosyalar yüklenemedi'
        });
    }
});

// Delete file
router.delete('/upload/:filename', protect, adminOnly, (req: Request, res: Response) => {
    const filePath = path.join(uploadDir, req.params.filename as string);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({
            success: true,
            message: 'Dosya silindi'
        });
        return;
    }

    res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı'
    });
});

export default router;
