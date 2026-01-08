import { Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { adminOnly, protect } from '../middleware/auth.js';

const router = Router();

// Upload directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for sharp processing
const storage = multer.memoryStorage();

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

// Resmi işle ve WebP'ye dönüştür
async function processImage(
    buffer: Buffer,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    } = {}
): Promise<{ buffer: Buffer; filename: string }> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}.webp`;

    const processedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

    return { buffer: processedBuffer, filename };
}

// Tek dosya yükle - otomatik WebP dönüşümü
router.post('/upload', protect, adminOnly, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        // Resmi işle ve WebP'ye dönüştür
        const { buffer, filename } = await processImage(req.file.buffer, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85
        });

        // Dosyayı kaydet
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, buffer);

        const fileUrl = `/uploads/${filename}`;

        res.json({
            success: true,
            data: {
                filename,
                url: fileUrl,
                originalName: req.file.originalname,
                format: 'webp',
                size: buffer.length
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Dosya yüklenemedi'
        });
    }
});

// Hero görseli için özel endpoint - büyük boyut
router.post('/upload/hero', protect, adminOnly, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        // Hero için daha büyük boyut
        const { buffer, filename } = await processImage(req.file.buffer, {
            maxWidth: 2560,
            maxHeight: 1440,
            quality: 90
        });

        // Dosyayı kaydet
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, buffer);

        const fileUrl = `/uploads/${filename}`;

        res.json({
            success: true,
            data: {
                filename,
                url: fileUrl,
                originalName: req.file.originalname,
                format: 'webp',
                size: buffer.length
            }
        });
    } catch (error) {
        console.error('Hero upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Hero görseli yüklenemedi'
        });
    }
});

// Çoklu dosya yükle
router.post('/upload/multiple', protect, adminOnly, upload.array('files', 10), async (req: Request, res: Response) => {
    try {
        const files = (req.files as Express.Multer.File[]) || [];
        if (!files.length) {
            res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
            return;
        }

        const results = await Promise.all(
            files.map(async (file) => {
                const { buffer, filename } = await processImage(file.buffer);
                const filePath = path.join(uploadDir, filename);
                await fs.promises.writeFile(filePath, buffer);
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
        res.status(500).json({
            success: false,
            message: 'Dosyalar yüklenemedi'
        });
    }
});

// Dosya sil
router.delete('/upload/:filename', protect, adminOnly, (req: Request, res: Response) => {
    const filePath = path.join(uploadDir, req.params.filename);

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
