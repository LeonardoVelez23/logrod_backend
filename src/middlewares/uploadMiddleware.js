import multer from 'multer';

export const MIME_A_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

const TIPOS_PERMITIDOS = Object.keys(MIME_A_EXTENSION);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    return cb(new Error('Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF.'));
  }
  cb(null, true);
};

export const uploadImagen = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES }
}).single('imagen');