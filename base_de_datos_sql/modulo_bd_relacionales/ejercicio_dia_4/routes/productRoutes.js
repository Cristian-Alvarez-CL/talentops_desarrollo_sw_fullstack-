const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../config/upload');
const { cache } = require('../middleware/cache');
const { productValidation } = require('../middleware/validation');

// Rutas públicas
router.get('/', cache(300), getProducts); // Cache de 5 minutos
router.get('/:id', cache(300), getProductById);

// Rutas protegidas
router.post('/', protect, admin, productValidation, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/upload', protect, admin, upload.single('imagen'), uploadProductImage);

module.exports = router;