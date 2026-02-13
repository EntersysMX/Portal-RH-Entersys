import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Target,
  CalendarCheck,
  DollarSign,
  Receipt,
  GraduationCap,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Home,
  User,
  Bell,
  CloudDownload,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { MenuSection } from '@/lib/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: MenuSection;
}

// Navegación admin/HR
const adminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'dashboard' },
  { name: 'Empleados', href: '/employees', icon: Users, section: 'employees' },
  { name: 'Reclutamiento', href: '/recruitment', icon: Briefcase, section: 'recruitment' },
  { name: 'Performance', href: '/performance', icon: Target, section: 'performance' },
  { name: 'Asistencia', href: '/attendance', icon: CalendarCheck, section: 'attendance' },
  { name: 'Nómina', href: '/payroll', icon: DollarSign, section: 'payroll' },
  { name: 'Nómina MX', href: '/nomina-mx', icon: Calculator, section: 'nomina-mx' },
  { name: 'Gastos', href: '/expenses', icon: Receipt, section: 'expenses' },
  { name: 'Capacitación', href: '/training', icon: GraduationCap, section: 'training' },
  { name: 'Organización', href: '/organization', icon: Building2, section: 'organization' },
  { name: 'Avisos', href: '/notices', icon: Bell, section: 'notices' },
  { name: 'Google Sync', href: '/google-sync', icon: CloudDownload, section: 'google-sync' },
  { name: 'Configuración', href: '/settings', icon: Settings, section: 'settings' },
];

// Navegación portal de empleado
const employeeNavigation: NavItem[] = [
  { name: 'Mi Portal', href: '/portal', icon: Home, section: 'portal' },
  { name: 'Mi Perfil', href: '/portal/profile', icon: User, section: 'my-profile' },
  { name: 'Mi Nómina', href: '/portal/payslips', icon: DollarSign, section: 'my-payslips' },
  { name: 'Mi Asistencia', href: '/portal/attendance', icon: CalendarCheck, section: 'my-attendance' },
  { name: 'Capacitación', href: '/portal/training', icon: GraduationCap, section: 'my-training' },
  { name: 'Organigrama', href: '/portal/organization', icon: Building2, section: 'my-organization' },
  { name: 'Avisos', href: '/portal/notices', icon: Bell, section: 'my-notices' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { canAccess, isEmployeeOnly, profileLabel, profileBadgeColor } = usePermissions();

  // Filtrar navegación según permisos
  const mainNav = isEmployeeOnly ? [] : adminNavigation.filter((item) => canAccess(item.section));
  const portalNav = employeeNavigation.filter((item) => canAccess(item.section));

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">EnterHR</h1>
              <p className="text-[10px] text-gray-400">Plataforma de Capital Humano</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <Users className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="border-b border-gray-200 px-4 py-2">
          <span className={clsx('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', profileBadgeColor)}>
            {profileLabel}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Admin/HR sections */}
        {mainNav.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Administración
              </p>
            )}
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </>
        )}

        {/* Separator */}
        {mainNav.length > 0 && portalNav.length > 0 && (
          <div className="my-3 border-t border-gray-200" />
        )}

        {/* Portal de empleado */}
        {portalNav.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {isEmployeeOnly ? 'Mi Portal' : 'Portal Empleado'}
              </p>
            )}
            {portalNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/portal'}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
