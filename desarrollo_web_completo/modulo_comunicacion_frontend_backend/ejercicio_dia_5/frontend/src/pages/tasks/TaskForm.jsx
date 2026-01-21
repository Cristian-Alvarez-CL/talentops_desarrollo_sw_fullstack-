import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasks } from '../../context/TaskContext';
import { Button, Input, Select } from '../../components/ui';

const taskSchema = z.object({
  title: z
    .string()
    .min(2, 'El titulo debe tener al menos 2 caracteres')
    .max(200, 'El titulo no puede exceder 200 caracteres'),
  description: z
    .string()
    .max(2000, 'La descripcion no puede exceder 2000 caracteres')
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const TaskForm = ({ projectId, task, members = [], onSuccess, onCancel }) => {
  const { createTask, updateTask } = useTasks();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'todo',
      assigneeId: task?.assignee?.id || '',
      dueDate: task?.due_date ? task.due_date.split('T')[0] : '',
    },
  });

  const onSubmit = async (data) => {
    // Format data
    const formattedData = {
      ...data,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };

    let result;

    if (isEditing) {
      result = await updateTask(projectId, task.id, formattedData);
    } else {
      result = await createTask(projectId, formattedData);
    }

    if (result.success) {
      onSuccess?.(result.data);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  const statusOptions = [
    { value: 'todo', label: 'Por hacer' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'review', label: 'En revision' },
    { value: 'done', label: 'Completado' },
  ];

  const memberOptions = [
    { value: '', label: 'Sin asignar' },
    ...members.map((member) => ({
      value: member.id,
      label: member.name,
    })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Titulo"
        placeholder="Describe la tarea..."
        error={errors.title?.message}
        {...register('title')}
      />

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Descripcion
        </label>
        <textarea
          placeholder="Detalles adicionales..."
          rows={4}
          className="block w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Prioridad"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />

        {isEditing && (
          <Select
            label="Estado"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Asignar a"
          options={memberOptions}
          error={errors.assigneeId?.message}
          {...register('assigneeId')}
        />

        <Input
          label="Fecha limite"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
