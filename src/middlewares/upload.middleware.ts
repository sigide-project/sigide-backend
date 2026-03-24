import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIMETYPES.join(', ')}`));
  }
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export const uploadSingle = uploadMiddleware.single('file');
