import multer from 'multer';

// Configurar almacenamiento en memoria
const storage = multer.memoryStorage();

// Configurar multer sin validaciones complejas
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middleware simple para manejar errores
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        errors: [{
          field: 'image',
          message: 'La imagen no puede exceder 5MB',
          code: 'IMAGE_TOO_LARGE'
        }]
      });
    }
    
    return res.status(400).json({
      errors: [{
        field: 'image',
        message: 'Error al subir la imagen',
        code: 'UPLOAD_ERROR'
      }]
    });
  }
  
  next(error);
};