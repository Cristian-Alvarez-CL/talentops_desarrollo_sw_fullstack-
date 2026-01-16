import { Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { query } from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import env from '../config/env.js';

const checkProjectAccess = async (projectId: string, userId: string): Promise<{ hasAccess: boolean; role: string | null }> => {
  const result = await query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return {
    hasAccess: result.rows.length > 0,
    role: result.rows.length > 0 ? result.rows[0].role : null
  };
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo',
        errors: [{ code: 'NO_FILE', message: 'Por favor seleccione una imagen' }]
      });
      return;
    }

    const avatarFilename = `avatar-${userId}-${Date.now()}.webp`;
    const avatarPath = path.join(process.cwd(), env.UPLOAD_DIR, 'avatars', avatarFilename);

    await fs.mkdir(path.dirname(avatarPath), { recursive: true });

    await sharp(file.path)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(avatarPath);

    await fs.unlink(file.path);

    const oldAvatarResult = await query('SELECT avatar FROM users WHERE id = $1', [userId]);
    const oldAvatar = oldAvatarResult.rows[0]?.avatar;

    const avatarUrl = `/uploads/avatars/${avatarFilename}`;
    await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, userId]);

    if (oldAvatar) {
      const oldAvatarPath = path.join(process.cwd(), oldAvatar.replace(/^\//, ''));
      try {
        await fs.unlink(oldAvatarPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    res.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {
        // Ignore cleanup errors
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir avatar',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query('SELECT avatar FROM users WHERE id = $1', [userId]);
    const avatar = result.rows[0]?.avatar;

    if (avatar) {
      const avatarPath = path.join(process.cwd(), avatar.replace(/^\//, ''));
      try {
        await fs.unlink(avatarPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    await query('UPDATE users SET avatar = NULL WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Avatar eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar avatar',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const uploadTaskAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo',
        errors: [{ code: 'NO_FILE', message: 'Por favor seleccione un archivo' }]
      });
      return;
    }

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess || access.role === 'viewer') {
      await fs.unlink(file.path);
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para subir archivos',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de miembro o superior' }]
      });
      return;
    }

    const taskCheck = await query(
      'SELECT id FROM tasks WHERE id = $1 AND project_id = $2',
      [taskId, projectId]
    );

    if (taskCheck.rows.length === 0) {
      await fs.unlink(file.path);
      res.status(404).json({
        success: false,
        message: 'Tarea no encontrada',
        errors: [{ code: 'NOT_FOUND', message: 'La tarea no existe' }]
      });
      return;
    }

    const attachmentsDir = path.join(process.cwd(), env.UPLOAD_DIR, 'attachments', projectId);
    await fs.mkdir(attachmentsDir, { recursive: true });

    const newFilename = `${taskId}-${Date.now()}-${file.originalname}`;
    const newPath = path.join(attachmentsDir, newFilename);

    await fs.rename(file.path, newPath);

    const result = await query(
      `INSERT INTO task_attachments (task_id, filename, original_name, mimetype, size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [taskId, newFilename, file.originalname, file.mimetype, file.size, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Upload task attachment error:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {
        // Ignore cleanup errors
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir archivo',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const deleteTaskAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId, attachmentId } = req.params;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No eres miembro del proyecto' }]
      });
      return;
    }

    const attachmentResult = await query(
      `SELECT * FROM task_attachments
       WHERE id = $1 AND task_id = $2`,
      [attachmentId, taskId]
    );

    if (attachmentResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El archivo no existe' }]
      });
      return;
    }

    const attachment = attachmentResult.rows[0];

    if (attachment.uploaded_by !== userId && !['owner', 'admin'].includes(access.role || '')) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este archivo',
        errors: [{ code: 'FORBIDDEN', message: 'Solo el propietario del archivo o administradores pueden eliminarlo' }]
      });
      return;
    }

    const filePath = path.join(
      process.cwd(),
      env.UPLOAD_DIR,
      'attachments',
      projectId,
      attachment.filename
    );

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }

    await query('DELETE FROM task_attachments WHERE id = $1', [attachmentId]);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete task attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const downloadTaskAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId, attachmentId } = req.params;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No eres miembro del proyecto' }]
      });
      return;
    }

    const attachmentResult = await query(
      `SELECT * FROM task_attachments
       WHERE id = $1 AND task_id = $2`,
      [attachmentId, taskId]
    );

    if (attachmentResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El archivo no existe' }]
      });
      return;
    }

    const attachment = attachmentResult.rows[0];
    const filePath = path.join(
      process.cwd(),
      env.UPLOAD_DIR,
      'attachments',
      projectId,
      attachment.filename
    );

    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor',
        errors: [{ code: 'FILE_NOT_FOUND', message: 'El archivo físico no existe' }]
      });
      return;
    }

    res.download(filePath, attachment.original_name);
  } catch (error) {
    console.error('Download task attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar archivo',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};
