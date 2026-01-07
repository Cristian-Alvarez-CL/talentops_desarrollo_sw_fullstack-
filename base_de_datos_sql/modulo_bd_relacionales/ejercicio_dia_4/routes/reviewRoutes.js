const express = require('express');
const router = express.Router();
const {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validation');
const { cache } = require('../middleware/cache');

router.post('/', protect, reviewValidation, addReview);
router.get('/product/:producto_id', cache(300), getProductReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;