import { Outlet } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">TaskFlow</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestiona tus proyectos<br />
            de manera eficiente
          </h1>
          <p className="text-primary-100 text-lg max-w-md">
            Organiza tareas, colabora con tu equipo y alcanza tus objetivos con nuestra
            plataforma de gestion de proyectos.
          </p>

          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-primary-200 text-sm">Equipos activos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className="text-primary-200 text-sm">Tareas completadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99%</p>
              <p className="text-primary-200 text-sm">Satisfaccion</p>
            </div>
          </div>
        </div>

        <p className="text-primary-200 text-sm">
          2024 TaskFlow. Todos los derechos reservados.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-secondary-900">TaskFlow</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
