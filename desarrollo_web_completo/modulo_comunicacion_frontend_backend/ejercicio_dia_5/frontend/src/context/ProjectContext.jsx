import { createContext, useContext, useState, useCallback } from 'react';
import projectService from '../services/project.service';
import toast from 'react-hot-toast';

const ProjectContext = createContext(null);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  const fetchProjects = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await projectService.getProjects({
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
      });

      if (response.success) {
        setProjects(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchProjectById = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await projectService.getProjectById(id);

      if (response.success) {
        setCurrentProject(response.data);
        return response.data;
      }
    } catch (error) {
      toast.error('Error al cargar proyecto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data) => {
    try {
      const response = await projectService.createProject(data);

      if (response.success) {
        setProjects((prev) => [response.data, ...prev]);
        toast.success('Proyecto creado');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear proyecto';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateProject = useCallback(async (id, data) => {
    try {
      const response = await projectService.updateProject(id, data);

      if (response.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? response.data : p))
        );
        if (currentProject?.id === id) {
          setCurrentProject((prev) => ({ ...prev, ...response.data }));
        }
        toast.success('Proyecto actualizado');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar proyecto';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentProject?.id]);

  const deleteProject = useCallback(async (id) => {
    try {
      const response = await projectService.deleteProject(id);

      if (response.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
        toast.success('Proyecto eliminado');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar proyecto';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentProject?.id]);

  const addMember = useCallback(async (projectId, data) => {
    try {
      const response = await projectService.addMember(projectId, data);

      if (response.success) {
        if (currentProject?.id === projectId) {
          setCurrentProject((prev) => ({
            ...prev,
            members: [...(prev.members || []), response.data],
          }));
        }
        toast.success('Miembro agregado');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al agregar miembro';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentProject?.id]);

  const removeMember = useCallback(async (projectId, userId) => {
    try {
      const response = await projectService.removeMember(projectId, userId);

      if (response.success) {
        if (currentProject?.id === projectId) {
          setCurrentProject((prev) => ({
            ...prev,
            members: prev.members.filter((m) => m.id !== userId),
          }));
        }
        toast.success('Miembro eliminado');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar miembro';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentProject?.id]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const value = {
    projects,
    currentProject,
    loading,
    pagination,
    filters,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateFilters,
    changePage,
    setCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
