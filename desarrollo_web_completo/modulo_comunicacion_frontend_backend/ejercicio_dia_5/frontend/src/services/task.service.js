import api from './api';

export const taskService = {
  async getTasks(projectId, params = {}) {
    const response = await api.get(`/tasks/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  async getTaskById(projectId, taskId) {
    const response = await api.get(`/tasks/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  async createTask(projectId, data) {
    const response = await api.post(`/tasks/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async updateTask(projectId, taskId, data) {
    const response = await api.put(`/tasks/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  async deleteTask(projectId, taskId) {
    const response = await api.delete(`/tasks/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  async updateTaskStatus(projectId, taskId, status) {
    const response = await api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/status`, { status });
    return response.data;
  },

  async getMyTasks(params = {}) {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  async uploadAttachment(projectId, taskId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/tasks/projects/${projectId}/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async deleteAttachment(projectId, taskId, attachmentId) {
    const response = await api.delete(
      `/tasks/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`
    );
    return response.data;
  },

  getAttachmentDownloadUrl(projectId, taskId, attachmentId) {
    return `/api/tasks/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`;
  },
};

export default taskService;
