import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  assigneeId: z.string().uuid('ID de asignado inválido').optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  description: z
    .string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().uuid('ID de asignado inválido').optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
});

export const taskQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'all']).optional().default('all'),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).optional().default('all'),
  assigneeId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'due_date', 'priority', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
