import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { Card, CardTitle, Button, StatusBadge, PriorityBadge, Avatar, Spinner } from '../components/ui';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <Card hover className="animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-secondary-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-secondary-900 mt-1">{value}</p>
        {trend && (
          <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { projects, fetchProjects, loading: projectsLoading } = useProjects();
  const { myTasks, fetchMyTasks, loading: tasksLoading } = useTasks();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    fetchProjects({ limit: 5 });
    fetchMyTasks({ limit: 5 });
  }, [fetchProjects, fetchMyTasks]);

  useEffect(() => {
    const completedTasks = myTasks.filter((t) => t.status === 'done').length;
    setStats({
      totalProjects: projects.length,
      totalTasks: myTasks.length,
      completedTasks,
      pendingTasks: myTasks.length - completedTasks,
    });
  }, [projects, myTasks]);

  const loading = projectsLoading || tasksLoading;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Hola, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-secondary-500 mt-1">
            Aqui tienes un resumen de tu actividad
          </p>
        </div>
        <Link to="/projects">
          <Button icon={Plus}>Nuevo Proyecto</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Proyectos"
          value={stats.totalProjects}
          color="bg-primary-500"
        />
        <StatCard
          icon={CheckSquare}
          label="Tareas Totales"
          value={stats.totalTasks}
          color="bg-violet-500"
        />
        <StatCard
          icon={CheckSquare}
          label="Completadas"
          value={stats.completedTasks}
          color="bg-green-500"
          trend="+12% esta semana"
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={stats.pendingTasks}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Proyectos Recientes</CardTitle>
            <Link
              to="/projects"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
              <p>No tienes proyectos aun</p>
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="mt-2">
                  Crear proyecto
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{project.name}</p>
                      <p className="text-sm text-secondary-500">
                        {project.task_count || 0} tareas
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* My Tasks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Mis Tareas</CardTitle>
            <Link
              to="/my-tasks"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : myTasks.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
              <p>No tienes tareas asignadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {task.project_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
