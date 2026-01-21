import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, Users, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Avatar,
  AvatarGroup,
  Spinner,
  Modal,
  ModalActions,
} from '../../components/ui';
import { ProjectForm } from './ProjectForm';

export const ProjectList = () => {
  const {
    projects,
    loading,
    pagination,
    filters,
    fetchProjects,
    deleteProject,
    updateFilters,
    changePage,
  } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, filters, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleDelete = async () => {
    if (selectedProject) {
      const result = await deleteProject(selectedProject.id);
      if (result.success) {
        setShowDeleteModal(false);
        setSelectedProject(null);
      }
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'archived', label: 'Archivado' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Proyectos</h1>
          <p className="text-secondary-500 mt-1">
            Gestiona y organiza tus proyectos
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar proyectos..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            />
          </div>
          <Button type="submit" icon={Filter} variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
          <h3 className="text-lg font-semibold text-secondary-900">
            No hay proyectos
          </h3>
          <p className="text-secondary-500 mt-2 mb-4">
            Crea tu primer proyecto para comenzar
          </p>
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Crear Proyecto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} hover className="relative group">
              <Link to={`/projects/${project.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-primary-600" />
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-secondary-500 text-sm line-clamp-2 mb-4">
                  {project.description || 'Sin descripcion'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                  <div className="flex items-center gap-4 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.member_count || 1}
                    </span>
                    <span>{project.task_count || 0} tareas</span>
                  </div>
                </div>
              </Link>

              {/* Actions dropdown */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedProject(project);
                    }}
                    className="p-2 rounded-lg hover:bg-secondary-100"
                  >
                    <MoreVertical className="w-4 h-4 text-secondary-500" />
                  </button>

                  {selectedProject?.id === project.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10">
                      <Link
                        to={`/projects/${project.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={() => setSelectedProject(null)}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => changePage(page)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                page === pagination.page
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Proyecto"
        description="Completa los datos para crear un nuevo proyecto"
      >
        <ProjectForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        title="Eliminar Proyecto"
        size="sm"
      >
        <p className="text-secondary-600">
          Estas seguro de que deseas eliminar el proyecto{' '}
          <span className="font-semibold">{selectedProject?.name}</span>?
          Esta accion no se puede deshacer.
        </p>
        <ModalActions>
          <Button
            variant="ghost"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedProject(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default ProjectList;
