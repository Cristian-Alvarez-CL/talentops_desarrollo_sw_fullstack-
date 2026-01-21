import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getMyTasks
} from '../controllers/task.controller.js';
import {
  uploadTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment
} from '../controllers/upload.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadAttachment } from '../middleware/upload.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema
} from '../schemas/task.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/my-tasks', getMyTasks);

router.post('/projects/:projectId/tasks', validate(createTaskSchema), createTask);
router.get('/projects/:projectId/tasks', validate(taskQuerySchema, 'query'), getTasks);
router.get('/projects/:projectId/tasks/:taskId', getTaskById);
router.put('/projects/:projectId/tasks/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/projects/:projectId/tasks/:taskId', deleteTask);

router.patch('/projects/:projectId/tasks/:taskId/status', updateTaskStatus);

router.post('/projects/:projectId/tasks/:taskId/attachments', uploadAttachment, uploadTaskAttachment);
router.delete('/projects/:projectId/tasks/:taskId/attachments/:attachmentId', deleteTaskAttachment);
router.get('/projects/:projectId/tasks/:taskId/attachments/:attachmentId/download', downloadTaskAttachment);

export default router;
