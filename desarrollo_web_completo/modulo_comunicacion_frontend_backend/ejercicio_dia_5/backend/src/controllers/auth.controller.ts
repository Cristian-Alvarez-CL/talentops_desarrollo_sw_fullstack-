import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import env from '../config/env.js';
import { AuthRequest, UserPayload } from '../types/index.js';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas/auth.schema.js';

const generateTokens = (user: UserPayload) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role }: RegisterInput = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
        errors: [{ field: 'email', code: 'EMAIL_EXISTS', message: 'Este email ya está en uso' }]
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, hashedPassword, name, role || 'member']
    );

    const user = result.rows[0];
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    const expiresAt = new Date(Date.now() + parseExpiry(env.REFRESH_TOKEN_EXPIRY));
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokens.refreshToken, expiresAt]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    const result = await query(
      'SELECT id, email, password, name, role, avatar FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: [{ code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' }]
      });
      return;
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: [{ code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' }]
      });
      return;
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    const expiresAt = new Date(Date.now() + parseExpiry(env.REFRESH_TOKEN_EXPIRY));
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokens.refreshToken, expiresAt]
    );

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    let decoded: { id: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
    } catch {
      res.status(401).json({
        success: false,
        message: 'Token de refresco inválido',
        errors: [{ code: 'INVALID_REFRESH_TOKEN', message: 'El token de refresco no es válido o ha expirado' }]
      });
      return;
    }

    const tokenResult = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
      [refreshToken, decoded.id]
    );

    if (tokenResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Token de refresco no encontrado',
        errors: [{ code: 'TOKEN_NOT_FOUND', message: 'Token de refresco inválido o expirado' }]
      });
      return;
    }

    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        errors: [{ code: 'USER_NOT_FOUND', message: 'El usuario asociado al token no existe' }]
      });
      return;
    }

    const user = userResult.rows[0];

    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    const expiresAt = new Date(Date.now() + parseExpiry(env.REFRESH_TOKEN_EXPIRY));
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokens.refreshToken, expiresAt]
    );

    res.json({
      success: true,
      message: 'Tokens renovados exitosamente',
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al renovar tokens',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    if (req.user) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      'SELECT id, email, name, role, avatar, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        errors: [{ code: 'USER_NOT_FOUND', message: 'El usuario no existe' }]
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, email }: UpdateProfileInput = req.body;

    if (email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'El email ya está en uso',
          errors: [{ field: 'email', code: 'EMAIL_EXISTS', message: 'Este email ya está registrado' }]
        });
        return;
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar',
        errors: [{ code: 'NO_DATA', message: 'Proporcione al menos un campo para actualizar' }]
      });
      return;
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, name, role, avatar, created_at, updated_at`,
      values
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword }: ChangePasswordInput = req.body;

    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        errors: [{ code: 'USER_NOT_FOUND', message: 'El usuario no existe' }]
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        errors: [{ field: 'currentPassword', code: 'INVALID_PASSWORD', message: 'La contraseña actual es incorrecta' }]
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Por favor, inicie sesión nuevamente.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};
