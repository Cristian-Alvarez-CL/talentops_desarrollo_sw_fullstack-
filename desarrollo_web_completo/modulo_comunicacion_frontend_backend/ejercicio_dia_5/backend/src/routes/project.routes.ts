import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole
} from '../controllers/project.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  projectQuerySchema
} from '../schemas/project.schema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', validate(createProjectSchema), createProject);
router.get('/', validate(projectQuerySchema, 'query'), getProjects);
router.get('/:id', getProjectById);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/members', validate(addMemberSchema), addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', validate(updateMemberRoleSchema), updateMemberRole);

export default router;
