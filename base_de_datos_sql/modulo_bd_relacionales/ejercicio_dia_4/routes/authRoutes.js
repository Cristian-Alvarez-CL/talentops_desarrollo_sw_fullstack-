const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation
} = require('../middleware/validation');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;