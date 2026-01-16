import { Menu, Bell, Search } from 'lucide-react';
import { Avatar } from '../ui';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-secondary-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-secondary-600" />
          </button>
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 pl-10 pr-4 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors">
            <Bell className="w-5 h-5 text-secondary-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-secondary-900">
                {user?.name}
              </p>
              <p className="text-xs text-secondary-500 capitalize">
                {user?.role}
              </p>
            </div>
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="md"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
