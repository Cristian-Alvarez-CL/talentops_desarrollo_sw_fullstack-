import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  status: z.enum(['active', 'completed', 'archived']).optional()
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  role: z.enum(['admin', 'member', 'viewer']).optional().default('member')
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer'])
});

export const projectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  status: z.enum(['active', 'completed', 'archived', 'all']).optional().default('all'),
  search: z.string().max(100).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
