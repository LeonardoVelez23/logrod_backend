import multer from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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