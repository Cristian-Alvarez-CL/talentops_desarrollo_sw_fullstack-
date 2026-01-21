import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, CheckSquare, Calendar, ArrowRight } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  PriorityBadge,
  Spinner,
} from '../../components/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const MyTasks = () => {
  const { myTasks, fetchMyTasks, updateTaskStatus, loading } = useTasks();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyTasks({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 });
  }, [fetchMyTasks, statusFilter]);

  const filteredTasks = myTasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'todo', label: 'Por hacer' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'review', label: 'En revision' },
    { value: 'done', label: 'Completadas' },
  ];

  const handleStatusChange = async (projectId, taskId, newStatus) => {
    await updateTaskStatus(projectId, taskId, newStatus);
    fetchMyTasks({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Mis Tareas</h1>
        <p className="text-secondary-500 mt-1">
          Todas las tareas que te han sido asignadas
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar tareas..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
          <h3 className="text-lg font-semibold text-secondary-900">
            No tienes tareas
          </h3>
          <p className="text-secondary-500 mt-2">
            Las tareas que te asignen apareceran aqui
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              hover
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-secondary-900 truncate">
                    {task.title}
                  </h3>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="text-sm text-secondary-500">
                  {task.project_name}
                </p>
                {task.due_date && (
                  <p className="text-sm text-secondary-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    Vence: {format(new Date(task.due_date), "dd 'de' MMMM", { locale: es })}
                  </p>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3">
                <Select
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(task.project_id, task.id, e.target.value)
                  }
                  options={[
                    { value: 'todo', label: 'Por hacer' },
                    { value: 'in_progress', label: 'En progreso' },
                    { value: 'review', label: 'En revision' },
                    { value: 'done', label: 'Completado' },
                  ]}
                  className="w-40"
                />
                <Link to={`/projects/${task.project_id}`}>
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    Ver proyecto
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
