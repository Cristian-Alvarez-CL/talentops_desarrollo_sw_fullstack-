import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Users,
  MoreVertical,
  UserPlus,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useTasks } from '../../context/TaskContext';
import {
  Card,
  CardTitle,
  Button,
  StatusBadge,
  Avatar,
  Spinner,
  Modal,
  ModalActions,
  Input,
  Select,
} from '../../components/ui';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskForm } from '../tasks/TaskForm';
import { ProjectForm } from './ProjectForm';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProjectById, deleteProject, loading: projectLoading } = useProjects();
  const { tasks, fetchTasks, loading: tasksLoading } = useTasks();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Calcular stats localmente desde las tareas para actualización instantánea
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  }, [tasks]);

  useEffect(() => {
    if (id) {
      fetchProjectById(id);
      fetchTasks(id);
    }
  }, [id, fetchProjectById, fetchTasks]);

  const handleDeleteProject = async () => {
    const result = await deleteProject(id);
    if (result.success) {
      navigate('/projects');
    }
  };

  const handleTaskSuccess = () => {
    setShowTaskModal(false);
    // No necesitamos llamar a fetchTasks porque createTask/updateTask
    // ya actualizan el estado local en TaskContext
  };

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <Card className="text-center py-12">
        <p className="text-secondary-500">Proyecto no encontrado</p>
        <Link to="/projects">
          <Button variant="ghost" className="mt-4">
            Volver a proyectos
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-secondary-900">
                {currentProject.name}
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-secondary-500 mt-1">
              {currentProject.description || 'Sin descripcion'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={UserPlus}
            onClick={() => setShowMemberModal(true)}
          >
            Agregar miembro
          </Button>
          <Button icon={Plus} onClick={() => setShowTaskModal(true)}>
            Nueva Tarea
          </Button>
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-secondary-100"
              onClick={() => {}}
            >
              <MoreVertical className="w-5 h-5 text-secondary-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats - Ahora calculados localmente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-sm text-secondary-500">Total Tareas</p>
          <p className="text-2xl font-bold text-secondary-900">
            {stats.total}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-secondary-500">Por Hacer</p>
          <p className="text-2xl font-bold text-secondary-900">
            {stats.todo}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-secondary-500">En Progreso</p>
          <p className="text-2xl font-bold text-primary-600">
            {stats.in_progress}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-secondary-500">Completadas</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.done}
          </p>
        </Card>
      </div>

      {/* Team */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipo ({currentProject.members?.length || 0})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            icon={UserPlus}
            onClick={() => setShowMemberModal(true)}
          >
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {currentProject.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg"
            >
              <Avatar src={member.avatar} name={member.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-secondary-900">
                  {member.name}
                </p>
                <p className="text-xs text-secondary-500 capitalize">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Task Board */}
      <TaskBoard
        projectId={id}
        tasks={tasks}
        loading={tasksLoading}
        onAddTask={() => setShowTaskModal(true)}
        members={currentProject.members}
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Nueva Tarea"
        description="Crea una nueva tarea para este proyecto"
      >
        <TaskForm
          projectId={id}
          members={currentProject.members}
          onSuccess={handleTaskSuccess}
          onCancel={() => setShowTaskModal(false)}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Proyecto"
      >
        <ProjectForm
          project={currentProject}
          onSuccess={() => {
            setShowEditModal(false);
            fetchProjectById(id);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Proyecto"
        size="sm"
      >
        <p className="text-secondary-600">
          Estas seguro de que deseas eliminar este proyecto?
          Se eliminaran todas las tareas asociadas.
        </p>
        <ModalActions>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteProject}>
            Eliminar
          </Button>
        </ModalActions>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Agregar Miembro"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Email del usuario"
            placeholder="usuario@email.com"
          />
          <Select
            label="Rol"
            options={[
              { value: 'member', label: 'Miembro' },
              { value: 'admin', label: 'Administrador' },
              { value: 'viewer', label: 'Observador' },
            ]}
          />
          <ModalActions>
            <Button variant="ghost" onClick={() => setShowMemberModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowMemberModal(false)}>
              Agregar
            </Button>
          </ModalActions>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
