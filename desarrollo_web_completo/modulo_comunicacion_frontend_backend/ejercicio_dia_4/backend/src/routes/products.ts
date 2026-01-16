import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { createProduct, validateProduct } from '../controllers/productController';

const router = Router();

// Validación en tiempo real
router.post('/validate', validateProduct);

// Crear producto con imagen - manejar errores de multer primero
router.post('/', 
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  createProduct
);

export default router;