import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserPayload, UserRole } from '../types/index.js';
import env from '../config/env.js';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
      errors: [{ code: 'NO_TOKEN', message: 'No se proporcionó token de autenticación' }]
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        errors: [{ code: 'TOKEN_EXPIRED', message: 'El token de acceso ha expirado' }]
      });
      return;
    }
    res.status(403).json({
      success: false,
      message: 'Token inválido',
      errors: [{ code: 'INVALID_TOKEN', message: 'El token proporcionado no es válido' }]
    });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
        errors: [{ code: 'NOT_AUTHENTICATED', message: 'Usuario no autenticado' }]
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado',
        errors: [{
          code: 'FORBIDDEN',
          message: `Se requiere rol: ${roles.join(' o ')}`
        }]
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
      req.user = decoded;
    } catch {
      // Token invalid, but continue without user
    }
  }

  next();
};
