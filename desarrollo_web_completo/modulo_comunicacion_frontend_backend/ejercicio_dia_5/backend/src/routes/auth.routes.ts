import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadAvatar, deleteAvatar } from '../controllers/upload.controller.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../schemas/auth.schema.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);
router.put('/password', authenticateToken, validate(changePasswordSchema), changePassword);

// Avatar routes
router.post('/avatar', authenticateToken, uploadAvatarMiddleware, uploadAvatar);
router.delete('/avatar', authenticateToken, deleteAvatar);

export default router;
