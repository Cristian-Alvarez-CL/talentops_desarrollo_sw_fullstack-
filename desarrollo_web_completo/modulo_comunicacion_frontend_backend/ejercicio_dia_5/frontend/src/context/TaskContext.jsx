import { createContext, useContext, useState, useCallback } from 'react';
import taskService from '../services/task.service';
import toast from 'react-hot-toast';

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const fetchTasks = useCallback(async (projectId, params = {}) => {
    setLoading(true);
    try {
      const response = await taskService.getTasks(projectId, {
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
      });

      if (response.success) {
        setTasks(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchTaskById = useCallback(async (projectId, taskId) => {
    setLoading(true);
    try {
      const response = await taskService.getTaskById(projectId, taskId);

      if (response.success) {
        setCurrentTask(response.data);
        return response.data;
      }
    } catch (error) {
      toast.error('Error al cargar tarea');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTasks = useCallback(async (params = {}) => {
    try {
      const response = await taskService.getMyTasks(params);

      if (response.success) {
        setMyTasks(response.data);
        return response.data;
      }
    } catch (error) {
      toast.error('Error al cargar mis tareas');
      return [];
    }
  }, []);

  const createTask = useCallback(async (projectId, data) => {
    try {
      const response = await taskService.createTask(projectId, data);

      if (response.success) {
        setTasks((prev) => [response.data, ...prev]);
        toast.success('Tarea creada');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear tarea';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateTask = useCallback(async (projectId, taskId, data) => {
    try {
      const response = await taskService.updateTask(projectId, taskId, data);

      if (response.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...response.data } : t))
        );
        if (currentTask?.id === taskId) {
          setCurrentTask((prev) => ({ ...prev, ...response.data }));
        }
        toast.success('Tarea actualizada');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar tarea';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentTask?.id]);

  const deleteTask = useCallback(async (projectId, taskId) => {
    try {
      const response = await taskService.deleteTask(projectId, taskId);

      if (response.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (currentTask?.id === taskId) {
          setCurrentTask(null);
        }
        toast.success('Tarea eliminada');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar tarea';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentTask?.id]);

  const updateTaskStatus = useCallback(async (projectId, taskId, status) => {
    try {
      const response = await taskService.updateTaskStatus(projectId, taskId, status);

      if (response.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
        if (currentTask?.id === taskId) {
          setCurrentTask((prev) => ({ ...prev, status }));
        }
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar estado';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentTask?.id]);

  const uploadAttachment = useCallback(async (projectId, taskId, file) => {
    try {
      const response = await taskService.uploadAttachment(projectId, taskId, file);

      if (response.success) {
        if (currentTask?.id === taskId) {
          setCurrentTask((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), response.data],
          }));
        }
        toast.success('Archivo subido');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al subir archivo';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentTask?.id]);

  const deleteAttachment = useCallback(async (projectId, taskId, attachmentId) => {
    try {
      const response = await taskService.deleteAttachment(projectId, taskId, attachmentId);

      if (response.success) {
        if (currentTask?.id === taskId) {
          setCurrentTask((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((a) => a.id !== attachmentId),
          }));
        }
        toast.success('Archivo eliminado');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar archivo';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentTask?.id]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const value = {
    tasks,
    currentTask,
    myTasks,
    loading,
    pagination,
    filters,
    fetchTasks,
    fetchTaskById,
    fetchMyTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    uploadAttachment,
    deleteAttachment,
    updateFilters,
    changePage,
    setCurrentTask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
