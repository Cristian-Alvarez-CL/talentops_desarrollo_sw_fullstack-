import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import env from '../config/env.js';

const allowedImageTypes = env.ALLOWED_IMAGE_TYPES.split(',');
const maxFileSize = parseInt(env.MAX_FILE_SIZE);

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(process.cwd(), env.UPLOAD_DIR);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedImageTypes.join(', ')}`));
  }
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    ...allowedImageTypes,
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'));
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: maxFileSize
  }
}).single('avatar');

export const uploadAttachment = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize * 2 // 10MB for attachments
  }
}).single('file');

export const uploadMultipleAttachments = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize * 2
  }
}).array('files', 5);
