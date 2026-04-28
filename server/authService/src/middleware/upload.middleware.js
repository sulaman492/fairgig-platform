import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
console.log('📁 Upload directory:', uploadDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('📂 Destination called, saving to:', uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `avatar-${req.user?.id || 'user'}-${uniqueSuffix}${ext}`;
        console.log('📸 Generated filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    console.log('🔍 File type check:', file.mimetype, 'Allowed:', mimetype);
    
    if (mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

console.log('✅ Upload middleware configured');