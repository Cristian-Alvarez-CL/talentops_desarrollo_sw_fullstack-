import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput, UpdateMemberRoleInput } from '../schemas/project.schema.js';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description }: CreateProjectInput = req.body;

    const projectResult = await query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, userId]
    );

    const project = projectResult.rows[0];

    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [project.id, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proyecto',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '10', status = 'all', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE pm.user_id = $1';
    const params: unknown[] = [userId];
    let paramCount = 2;

    if (status !== 'all') {
      whereClause += ` AND p.status = $${paramCount++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const result = await query(
      `SELECT p.*,
              u.name as owner_name,
              pm.role as member_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ORDER BY p.updated_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const memberCheck = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No eres miembro de este proyecto' }]
      });
      return;
    }

    const result = await query(
      `SELECT p.*,
              u.name as owner_name,
              u.email as owner_email
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El proyecto no existe' }]
      });
      return;
    }

    const membersResult = await query(
      `SELECT u.id, u.name, u.email, u.avatar, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at`,
      [id]
    );

    const statsResult = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'todo') as todo,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COUNT(*) FILTER (WHERE status = 'review') as review,
         COUNT(*) FILTER (WHERE status = 'done') as done
       FROM tasks
       WHERE project_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        members: membersResult.rows,
        stats: statsResult.rows[0],
        userRole: memberCheck.rows[0].role
      }
    });
  } catch (error) {
    console.error('Get project by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyecto',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, status }: UpdateProjectInput = req.body;

    const memberCheck = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de propietario o administrador' }]
      });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar',
        errors: [{ code: 'NO_DATA', message: 'Proporcione al menos un campo para actualizar' }]
      });
      return;
    }

    values.push(id);

    const result = await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El proyecto no existe' }]
      });
      return;
    }

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proyecto',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const projectCheck = await query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [id]
    );

    if (projectCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El proyecto no existe' }]
      });
      return;
    }

    if (projectCheck.rows[0].owner_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el propietario puede eliminar el proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'No tienes permisos para eliminar este proyecto' }]
      });
      return;
    }

    await query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proyecto',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const { id } = req.params;
    const { userId, role }: AddMemberInput = req.body;

    const memberCheck = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, currentUserId]
    );

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar miembros',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de propietario o administrador' }]
      });
      return;
    }

    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        errors: [{ code: 'USER_NOT_FOUND', message: 'El usuario especificado no existe' }]
      });
      return;
    }

    const existingMember = await query(
      'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingMember.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'El usuario ya es miembro del proyecto',
        errors: [{ code: 'ALREADY_MEMBER', message: 'Este usuario ya pertenece al proyecto' }]
      });
      return;
    }

    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [id, userId, role || 'member']
    );

    const memberResult = await query(
      'SELECT u.id, u.name, u.email, u.avatar FROM users u WHERE u.id = $1',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Miembro agregado exitosamente',
      data: {
        ...memberResult.rows[0],
        role: role || 'member'
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar miembro',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const { id, userId } = req.params;

    const memberCheck = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, currentUserId]
    );

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar miembros',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de propietario o administrador' }]
      });
      return;
    }

    const targetMember = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (targetMember.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Miembro no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El usuario no es miembro del proyecto' }]
      });
      return;
    }

    if (targetMember.rows[0].role === 'owner') {
      res.status(403).json({
        success: false,
        message: 'No se puede eliminar al propietario del proyecto',
        errors: [{ code: 'FORBIDDEN', message: 'El propietario no puede ser eliminado' }]
      });
      return;
    }

    await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Miembro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar miembro',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const { id, userId } = req.params;
    const { role }: UpdateMemberRoleInput = req.body;

    const ownerCheck = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, currentUserId]
    );

    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
      res.status(403).json({
        success: false,
        message: 'Solo el propietario puede cambiar roles',
        errors: [{ code: 'FORBIDDEN', message: 'Se requiere rol de propietario' }]
      });
      return;
    }

    const targetMember = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (targetMember.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Miembro no encontrado',
        errors: [{ code: 'NOT_FOUND', message: 'El usuario no es miembro del proyecto' }]
      });
      return;
    }

    if (targetMember.rows[0].role === 'owner') {
      res.status(403).json({
        success: false,
        message: 'No se puede cambiar el rol del propietario',
        errors: [{ code: 'FORBIDDEN', message: 'El rol de propietario no puede ser modificado' }]
      });
      return;
    }

    await query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3',
      [role, id, userId]
    );

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }]
    });
  }
};
