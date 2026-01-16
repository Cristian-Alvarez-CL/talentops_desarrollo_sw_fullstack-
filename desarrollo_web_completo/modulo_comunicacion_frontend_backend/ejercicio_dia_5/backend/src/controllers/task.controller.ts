import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';

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

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { title, description, priority, assigneeId, dueDate }: CreateTaskInput = req.body;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess || access.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear tareas en este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de miembro o superior' }]
      });
      return;
    }

    if (assigneeId) {
      const assigneeAccess = await checkProjectAccess(projectId, assigneeId);
      if (!assigneeAccess.hasAccess) {
        res.status(400).json({
          success: false,
          message: 'El usuario asignado no es miembro del proyecto',
          errors: [{ field: 'assigneeId', code: 'INVALID_ASSIGNEE', message: 'El usuario debe ser miembro del proyecto' }]
        });
        return;
      }
    }

    const result = await query(
      `INSERT INTO tasks (title, description, priority, project_id, assignee_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, priority || 'medium', projectId, assigneeId || null, dueDate || null]
    );

    const task = result.rows[0];

    if (task.assignee_id) {
      const assigneeResult = await query(
        'SELECT id, name, email, avatar FROM users WHERE id = $1',
        [task.assignee_id]
      );
      task.assignee = assigneeResult.rows[0];
    }

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear tarea',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const {
      page = '1',
      limit = '20',
      status = 'all',
      priority = 'all',
      assigneeId,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No eres miembro del proyecto' }]
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE t.project_id = $1';
    const params: unknown[] = [projectId];
    let paramCount = 2;

    if (status !== 'all') {
      whereClause += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    if (priority !== 'all') {
      whereClause += ` AND t.priority = $${paramCount++}`;
      params.push(priority);
    }

    if (assigneeId) {
      whereClause += ` AND t.assignee_id = $${paramCount++}`;
      params.push(assigneeId);
    }

    if (search) {
      whereClause += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const allowedSortColumns = ['created_at', 'due_date', 'priority', 'title'];
    const safeSortBy = allowedSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Get tasks
    const result = await query(
      `SELECT t.*,
              u.id as assignee_id,
              u.name as assignee_name,
              u.email as assignee_email,
              u.avatar as assignee_avatar,
              (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       ${whereClause}
       ORDER BY t.${safeSortBy} ${safeSortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limitNum, offset]
    );

    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      project_id: row.project_id,
      due_date: row.due_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      attachment_count: parseInt(row.attachment_count),
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email,
        avatar: row.assignee_avatar
      } : null
    }));

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId } = req.params;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No eres miembro del proyecto' }]
      });
      return;
    }

    const result = await query(
      `SELECT t.*,
              u.id as assignee_id,
              u.name as assignee_name,
              u.email as assignee_email,
              u.avatar as assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = $1 AND t.project_id = $2`,
      [taskId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tarea no encontrada',
        errors: [{ code: 'NOT_FOUND', message: 'La tarea no existe' }]
      });
      return;
    }

    const row = result.rows[0];

    const attachmentsResult = await query(
      `SELECT ta.*, u.name as uploader_name
       FROM task_attachments ta
       JOIN users u ON ta.uploaded_by = u.id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC`,
      [taskId]
    );

    const task = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      project_id: row.project_id,
      due_date: row.due_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email,
        avatar: row.assignee_avatar
      } : null,
      attachments: attachmentsResult.rows
    };

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarea',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId } = req.params;
    const { title, description, status, priority, assigneeId, dueDate }: UpdateTaskInput = req.body;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess || access.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar tareas',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de miembro o superior' }]
      });
      return;
    }

    if (assigneeId) {
      const assigneeAccess = await checkProjectAccess(projectId, assigneeId);
      if (!assigneeAccess.hasAccess) {
        res.status(400).json({
          success: false,
          message: 'El usuario asignado no es miembro del proyecto',
          errors: [{ field: 'assigneeId', code: 'INVALID_ASSIGNEE', message: 'El usuario debe ser miembro del proyecto' }]
        });
        return;
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (assigneeId !== undefined) {
      updates.push(`assignee_id = $${paramCount++}`);
      values.push(assigneeId);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar',
        errors: [{ code: 'NO_DATA', message: 'Proporcione al menos un campo para actualizar' }]
      });
      return;
    }

    values.push(taskId, projectId);

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND project_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tarea no encontrada',
        errors: [{ code: 'NOT_FOUND', message: 'La tarea no existe' }]
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tarea',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId } = req.params;
    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess || !['owner', 'admin'].includes(access.role || '')) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar tareas',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de administrador o propietario' }]
      });
      return;
    }

    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id',
      [taskId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tarea no encontrada',
        errors: [{ code: 'NOT_FOUND', message: 'La tarea no existe' }]
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarea',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, taskId } = req.params;
    const { status } = req.body;

    const access = await checkProjectAccess(projectId, userId);
    if (!access.hasAccess || access.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar el estado',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de miembro o superior' }]
      });
      return;
    }

    const result = await query(
      `UPDATE tasks SET status = $1
       WHERE id = $2 AND project_id = $3
       RETURNING *`,
      [status, taskId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tarea no encontrada',
        errors: [{ code: 'NOT_FOUND', message: 'La tarea no existe' }]
      });
      return;
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status = 'all', limit = '10' } = req.query;

    let whereClause = 'WHERE t.assignee_id = $1';
    const params: unknown[] = [userId];
    let paramCount = 2;

    if (status !== 'all') {
      whereClause += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    params.push(parseInt(limit as string));

    const result = await query(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       ${whereClause}
       ORDER BY
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC
       LIMIT $${paramCount}`,
      params
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};
