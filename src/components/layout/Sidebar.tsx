import { NavLink } from 'react-router-dom';
import {
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Store,
  Database,
  BookOpen,
  CloudDownload,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleStore } from '@/store/moduleStore';
import { useSidebarOrder } from '@/hooks/useSidebarOrder';
import { useSidebarState } from '@/hooks/useSidebarState';
import type { MenuSection } from '@/lib/permissions';
import type { ModuleNavItem } from '@/modules/types';
import SidebarCustomizer from '@/components/sidebar/SidebarCustomizer';
import BrandedLogo from '@/components/ui/BrandedLogo';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: MenuSection;
  end?: boolean;
  category?: string;
}

/** Colores sutiles por categoría para los iconos del sidebar */
const CATEGORY_ICON_COLORS: Record<string, { active: string; idle: string }> = {
  core:    { active: 'text-gray-700',   idle: 'text-gray-500' },
  hr:      { active: 'text-blue-600',   idle: 'text-blue-500' },
  payroll: { active: 'text-emerald-600', idle: 'text-emerald-500' },
  talent:  { active: 'text-violet-600', idle: 'text-violet-500' },
  admin:   { active: 'text-orange-600', idle: 'text-orange-500' },
  portal:  { active: 'text-cyan-600',   idle: 'text-cyan-500' },
};

const CATEGORY_ACTIVE_BG: Record<string, string> = {
  core:    'bg-gray-100',
  hr:      'bg-blue-50',
  payroll: 'bg-emerald-50',
  talent:  'bg-violet-50',
  admin:   'bg-orange-50',
  portal:  'bg-cyan-50',
};

// Admin panel navigation (always available for admins)
const adminPanelNavigation: NavItem[] = [
  { name: 'Módulos', href: '/admin/modules', icon: Store, section: 'admin-modules', category: 'admin' },
  { name: 'Roles', href: '/admin/roles', icon: Shield, section: 'admin-roles', category: 'admin' },
  { name: 'Usuarios', href: '/admin/users', icon: Users, section: 'admin-users', category: 'admin' },
  { name: 'Catálogos', href: '/admin/catalogs', icon: Database, section: 'admin-catalogs', category: 'admin' },
  { name: 'Plataforma', href: '/admin/platform', icon: BookOpen, section: 'admin-platform', category: 'admin' },
  { name: 'Google Sync', href: '/google-sync', icon: CloudDownload, section: 'google-sync', category: 'admin' },
  { name: 'Configuración', href: '/settings', icon: Settings, section: 'settings', category: 'admin' },
];

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebarState();
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
            category: mod.category,
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
          category: 'portal',
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

  // On mobile, clicking a nav link should close the sidebar
  const handleNavClick = () => {
    closeMobile();
  };

  // In desktop (>= lg): show as fixed sidebar with collapse
  // In mobile (< lg): show as overlay when mobileOpen, hidden otherwise
  // On mobile, sidebar is always full-width (w-64), never collapsed to icons
  const sidebarContent = (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-slate-50 transition-all duration-300',
        // Desktop: show always, respect collapsed
        'max-lg:w-64',
        // Desktop collapsed/expanded
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        // Mobile: slide in/out
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
      )}
    >
      {/* Sidebar Customizer overlay */}
      {showCustomizer && (
        <SidebarCustomizer onClose={() => setShowCustomizer(false)} />
      )}

      {/* Logo — dynamic branding — area más grande */}
      <div data-tour="sidebar-logo" className="flex items-center border-b border-gray-200 bg-white px-4" style={{ minHeight: collapsed ? 64 : 72 }}>
        {(!collapsed || mobileOpen) && (
          <div className="flex items-center gap-3 py-3 lg:hidden">
            {branding.companyLogoUrl ? (
              <BrandedLogo src={branding.companyLogoUrl} size="lg" className="!h-11 !w-11" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">EnterHR</h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                {branding.companyName || 'Plataforma de Capital Humano'}
              </p>
            </div>
          </div>
        )}
        {/* Desktop expanded */}
        {!collapsed && (
          <div className="hidden items-center gap-3 py-3 lg:flex">
            {branding.companyLogoUrl ? (
              <BrandedLogo src={branding.companyLogoUrl} size="lg" className="!h-11 !w-11" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">EnterHR</h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                {branding.companyName || 'Plataforma de Capital Humano'}
              </p>
            </div>
          </div>
        )}
        {/* Desktop collapsed */}
        {collapsed && (
          <div className="mx-auto hidden py-3 lg:block">
            {branding.companyLogoUrl ? (
              <BrandedLogo src={branding.companyLogoUrl} size="md" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role badge — show on mobile always, on desktop only when expanded */}
      {(!collapsed || mobileOpen) && (
        <div className={clsx('border-b border-gray-200 bg-white px-4 py-2', collapsed && 'lg:hidden')}>
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
            {(!collapsed || mobileOpen) && (
              <p className={clsx('mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400', collapsed && 'lg:hidden')}>
                Administración
              </p>
            )}
            <div data-tour="sidebar-admin-nav" className="space-y-0.5">
              {visibleMain.map((item) => {
                const tourId = item.href.replace(/\//g, '-').replace(/^-/, '');
                const cat = item.category || 'core';
                const colors = CATEGORY_ICON_COLORS[cat] || CATEGORY_ICON_COLORS.core;
                const activeBg = CATEGORY_ACTIVE_BG[cat] || CATEGORY_ACTIVE_BG.core;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    data-tour={`nav-${tourId}`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? `${activeBg} text-gray-900`
                          : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm',
                        collapsed && 'lg:justify-center'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={clsx('h-5 w-5 flex-shrink-0', isActive ? colors.active : colors.idle)} />
                        {/* Show text on mobile always; on desktop only when not collapsed */}
                        <span className={clsx(collapsed && 'lg:hidden')}>{item.name}</span>
                      </>
                    )}
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
            {(!collapsed || mobileOpen) && (
              <p className={clsx('mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400', collapsed && 'lg:hidden')}>
                {isEmployeeOnly ? 'Mi Portal' : 'Portal Empleado'}
              </p>
            )}
            <div data-tour="sidebar-portal-nav" className="space-y-0.5">
              {visiblePortal.map((item) => {
                const cat = item.category || 'portal';
                const colors = CATEGORY_ICON_COLORS[cat] || CATEGORY_ICON_COLORS.portal;
                const activeBg = CATEGORY_ACTIVE_BG[cat] || CATEGORY_ACTIVE_BG.portal;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    data-tour={`nav-${item.section}`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? `${activeBg} text-gray-900`
                          : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm',
                        collapsed && 'lg:justify-center'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={clsx('h-5 w-5 flex-shrink-0', isActive ? colors.active : colors.idle)} />
                        <span className={clsx(collapsed && 'lg:hidden')}>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
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
            {(!collapsed || mobileOpen) && (
              <p className={clsx('mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400', collapsed && 'lg:hidden')}>
                Panel Admin
              </p>
            )}
            <div className="space-y-0.5">
              {visibleAdmin.map((item) => {
                const colors = CATEGORY_ICON_COLORS.admin;
                const activeBg = CATEGORY_ACTIVE_BG.admin;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? `${activeBg} text-gray-900`
                          : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm',
                        collapsed && 'lg:justify-center'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={clsx('h-5 w-5 flex-shrink-0', isActive ? colors.active : colors.idle)} />
                        <span className={clsx(collapsed && 'lg:hidden')}>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom buttons */}
      <div className="border-t border-gray-200 bg-white p-3 space-y-1">
        {/* Customize sidebar button (only when expanded or on mobile) */}
        {(!collapsed || mobileOpen) && (
          <button
            onClick={() => setShowCustomizer(true)}
            className={clsx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600', collapsed && 'lg:hidden')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Personalizar</span>
          </button>
        )}
        {/* Collapse button — desktop only */}
        <button
          onClick={toggle}
          className="hidden w-full items-center justify-center rounded-lg py-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:flex"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}
      {sidebarContent}
    </>
  );
}
