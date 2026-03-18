import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User, ChevronDown, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { profileLabel, profileBadgeColor, isEmployeeOnly } = usePermissions();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/portal/profile');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/90 px-6 shadow-sm backdrop-blur-md">
      {/* Search */}
      <div data-tour="topbar-search" className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar empleados, vacantes, documentos..."
          className="input pl-10"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block ${profileBadgeColor}`}>
          {profileLabel}
        </span>

        {/* Notifications */}
        <button
          data-tour="topbar-notifications"
          onClick={() => navigate(isEmployeeOnly ? '/portal/notices' : '/notices')}
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Avisos"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div data-tour="topbar-user" className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-700">
                {user?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400">{user?.email || 'admin@empresa.com'}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleProfileClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </button>
              {!isEmployeeOnly && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/portal');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="h-4 w-4" />
                  Portal Empleado
                </button>
              )}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
