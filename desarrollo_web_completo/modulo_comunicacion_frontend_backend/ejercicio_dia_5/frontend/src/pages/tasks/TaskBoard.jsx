import { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, GripVertical, MoreVertical, Calendar, Paperclip } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { Card, Button, StatusBadge, PriorityBadge, Avatar, Spinner, Modal } from '../../components/ui';
import { TaskForm } from './TaskForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLUMNS = [
  { id: 'todo', title: 'Por Hacer', color: 'bg-secondary-200' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-blue-200' },
  { id: 'review', title: 'En Revision', color: 'bg-yellow-200' },
  { id: 'done', title: 'Completado', color: 'bg-green-200' },
];

const TaskCard = ({ task, projectId, onEdit, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <PriorityBadge priority={task.priority} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-secondary-100"
        >
          <MoreVertical className="w-4 h-4 text-secondary-400" />
        </button>
      </div>

      <h4 className="font-medium text-secondary-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-sm text-secondary-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100">
        <div className="flex items-center gap-3 text-xs text-secondary-500">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date), 'dd MMM', { locale: es })}
            </span>
          )}
          {task.attachment_count > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {task.attachment_count}
            </span>
          )}
        </div>

        {task.assignee && (
          <Avatar
            src={task.assignee.avatar}
            name={task.assignee.name}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};

const Column = ({ column, tasks, projectId, onAddTask, onEditTask, onStatusChange }) => {
  const columnTasks = tasks.filter((task) => task.status === column.id);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-secondary-100');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-secondary-100');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-secondary-100');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, column.id);
    }
  };

  return (
    <div
      className="flex-1 min-w-[280px] max-w-[350px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('w-3 h-3 rounded-full', column.color)} />
          <h3 className="font-semibold text-secondary-900">{column.title}</h3>
          <span className="text-sm text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 min-h-[200px] p-2 rounded-lg bg-secondary-50/50 transition-colors">
        {columnTasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
            }}
          >
            <TaskCard
              task={task}
              projectId={projectId}
              onEdit={onEditTask}
              onStatusChange={onStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TaskBoard = ({ projectId, tasks, loading, onAddTask, members }) => {
  const { updateTaskStatus } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(projectId, taskId, newStatus);
  };

  const handleAddTask = (status) => {
    setInitialStatus(status);
    onAddTask?.();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasks}
            projectId={projectId}
            onAddTask={handleAddTask}
            onEditTask={setEditingTask}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Editar Tarea"
        size="lg"
      >
        {editingTask && (
          <TaskForm
            projectId={projectId}
            task={editingTask}
            members={members}
            onSuccess={() => setEditingTask(null)}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default TaskBoard;
