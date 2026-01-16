import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjects } from '../../context/ProjectContext';
import { Button, Input, Select } from '../../components/ui';

const projectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(1000, 'La descripcion no puede exceder 1000 caracteres')
    .optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const ProjectForm = ({ project, onSuccess, onCancel }) => {
  const { createProject, updateProject } = useProjects();
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'active',
    },
  });

  const onSubmit = async (data) => {
    let result;

    if (isEditing) {
      result = await updateProject(project.id, data);
    } else {
      result = await createProject(data);
    }

    if (result.success) {
      onSuccess?.(result.data);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'archived', label: 'Archivado' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Nombre del proyecto"
        placeholder="Mi nuevo proyecto"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Descripcion
        </label>
        <textarea
          placeholder="Describe tu proyecto..."
          rows={4}
          className="block w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {isEditing && (
        <Select
          label="Estado"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Crear proyecto'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
