import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'avatar' ? 'avatars' : file.fieldname === 'file' ? 'files' : 'misc';
    const dir = path.join(uploadDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const maxSize = file.fieldname === 'avatar' ? 2 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxSize) return cb(new Error('File quá lớn'));
  if (file.fieldname === 'avatar') {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Chỉ chấp nhận ảnh'));
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Chỉ chấp nhận ảnh (jpg, png, gif, webp)'));
    cb(null, true);
  },
}).single('avatar');

export const uploadFile = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('file');

export const uploadFiles = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).array('files', 5);
