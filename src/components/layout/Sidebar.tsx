import { NavLink } from 'react-router-dom';
import {
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  BookOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleStore } from '@/store/moduleStore';
import { useSidebarOrder } from '@/hooks/useSidebarOrder';
import type { MenuSection } from '@/lib/permissions';
import type { ModuleNavItem } from '@/modules/types';
import SidebarCustomizer from '@/components/sidebar/SidebarCustomizer';
import BrandedLogo from '@/components/ui/BrandedLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: MenuSection;
  end?: boolean;
}

// Admin panel navigation (always available for admins)
const adminPanelNavigation: NavItem[] = [
  { name: 'Módulos', href: '/admin/modules', icon: Shield, section: 'admin-modules' },
  { name: 'Roles', href: '/admin/roles', icon: Shield, section: 'admin-roles' },
  { name: 'Usuarios', href: '/admin/users', icon: Users, section: 'admin-users' },
  { name: 'Catálogos', href: '/admin/catalogs', icon: Database, section: 'admin-catalogs' },
  { name: 'Plataforma', href: '/admin/platform', icon: BookOpen, section: 'admin-platform' },
  { name: 'Configuración', href: '/settings', icon: Settings, section: 'settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const { canAccess, isEmployeeOnly, profileLabel, profileBadgeColor } = usePermissions();

  // Subscribe to manifest + branding so Sidebar re-renders when they change
  const manifest = useModuleStore((s) => s.manifest);
  const branding = useModuleStore((s) => s.branding);

  // Use sidebar order (admin order + user preferences)
  const { orderedModules } = useSidebarOrder();

  // Generate navigation from ordered modules
  const { mainNav, portalNav, adminNav } = useMemo(() => {
    // Admin/HR nav: all non-portal modules
    const mainItems: NavItem[] = [];
    orderedModules
      .filter((m) => m.category !== 'portal')
      .forEach((mod) => {
        mod.navItems.forEach((item: ModuleNavItem) => {
          mainItems.push({
            name: item.label,
            href: item.path,
            icon: item.icon,
            section: item.section as MenuSection,
            end: item.end,
          });
        });
      });

    // Portal nav: only portal module
    const portalItems: NavItem[] = [];
    const portalModule = orderedModules.find((m) => m.category === 'portal');
    if (portalModule) {
      portalModule.navItems.forEach((item: ModuleNavItem) => {
        portalItems.push({
          name: item.label,
          href: item.path,
          icon: item.icon,
          section: item.section as MenuSection,
          end: item.end,
        });
      });
    }

    return {
      mainNav: mainItems,
      portalNav: portalItems,
      adminNav: adminPanelNavigation,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest, orderedModules]);

  // Filter by user permissions
  const visibleMain = isEmployeeOnly ? [] : mainNav.filter((item) => canAccess(item.section));
  const visiblePortal = portalNav.filter((item) => canAccess(item.section));
  const visibleAdmin = isEmployeeOnly ? [] : adminNav.filter((item) => canAccess(item.section));

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Sidebar Customizer overlay */}
      {showCustomizer && (
        <SidebarCustomizer onClose={() => setShowCustomizer(false)} />
      )}

      {/* Logo — dynamic branding */}
      <div data-tour="sidebar-logo" className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {branding.companyLogoUrl ? (
              <BrandedLogo src={branding.companyLogoUrl} size="md" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                <Users className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">EnterHR</h1>
              <p className="text-[10px] text-gray-400">
                {branding.companyName || 'Plataforma de Capital Humano'}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          branding.companyLogoUrl ? (
            <BrandedLogo src={branding.companyLogoUrl} size="md" className="mx-auto" />
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Users className="h-5 w-5 text-white" />
            </div>
          )
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
        {/* Admin/HR sections (from modules) */}
        {visibleMain.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Administración
              </p>
            )}
            <div data-tour="sidebar-admin-nav">
              {visibleMain.map((item) => {
                const tourId = item.href.replace(/\//g, '-').replace(/^-/, '');
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    data-tour={`nav-${tourId}`}
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
                );
              })}
            </div>
          </>
        )}

        {/* Separator before portal */}
        {visibleMain.length > 0 && visiblePortal.length > 0 && (
          <div className="my-3 border-t border-gray-200" />
        )}

        {/* Portal de empleado */}
        {visiblePortal.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {isEmployeeOnly ? 'Mi Portal' : 'Portal Empleado'}
              </p>
            )}
            <div data-tour="sidebar-portal-nav">
              {visiblePortal.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  data-tour={`nav-${item.section}`}
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
            </div>
          </>
        )}

        {/* Separator before admin panel */}
        {visibleAdmin.length > 0 && (visibleMain.length > 0 || visiblePortal.length > 0) && (
          <div className="my-3 border-t border-gray-200" />
        )}

        {/* Admin Panel */}
        {visibleAdmin.length > 0 && (
          <>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Panel Admin
              </p>
            )}
            {visibleAdmin.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
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

      {/* Bottom buttons */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        {/* Customize sidebar button (only when expanded) */}
        {!collapsed && (
          <button
            onClick={() => setShowCustomizer(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Personalizar</span>
          </button>
        )}
        {/* Collapse button */}
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
