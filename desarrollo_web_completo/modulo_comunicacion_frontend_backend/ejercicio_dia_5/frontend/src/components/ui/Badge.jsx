import { clsx } from 'clsx';

const variants = {
  default: 'bg-secondary-100 text-secondary-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Status badge presets
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    todo: { label: 'Por hacer', variant: 'default' },
    in_progress: { label: 'En progreso', variant: 'info' },
    review: { label: 'En revision', variant: 'warning' },
    done: { label: 'Completado', variant: 'success' },
    active: { label: 'Activo', variant: 'success' },
    completed: { label: 'Completado', variant: 'primary' },
    archived: { label: 'Archivado', variant: 'default' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Priority badge presets
export const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { label: 'Baja', variant: 'default' },
    medium: { label: 'Media', variant: 'info' },
    high: { label: 'Alta', variant: 'warning' },
    urgent: { label: 'Urgente', variant: 'danger' },
  };

  const config = priorityConfig[priority] || { label: priority, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default Badge;
