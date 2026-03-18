import { Users } from 'lucide-react';
import { ALL_MODULES } from '@/modules/registry';
import { useModuleStore } from '@/store/moduleStore';
import type { ModuleManifest } from '@/modules/types';
import BrandedLogo from '@/components/ui/BrandedLogo';

const ICON_COLOR: Record<string, string> = {
  core:    'text-gray-500',
  hr:      'text-blue-500',
  payroll: 'text-emerald-500',
  talent:  'text-violet-500',
  admin:   'text-orange-500',
  portal:  'text-cyan-500',
};

/** Panel compacto que muestra cómo se verá el sidebar resultante */
export default function SidebarPreview() {
  const manifest = useModuleStore((s) => s.manifest);
  const branding = useModuleStore((s) => s.branding);

  const orderedEnabled = getOrderedEnabled(manifest);

  const mainItems = orderedEnabled.filter((m) => m.category !== 'portal');
  const portalItems = orderedEnabled.filter((m) => m.category === 'portal');

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-slate-50 overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vista previa</p>
      </div>

      <div className="p-2">
        {/* Logo area */}
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 mb-2 shadow-sm">
          {branding.companyLogoUrl ? (
            <BrandedLogo src={branding.companyLogoUrl} size="sm" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-primary-700">
              <Users className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">EnterHR</p>
            <p className="text-[9px] text-gray-400 truncate">
              {branding.companyName || 'Capital Humano'}
            </p>
          </div>
        </div>

        {/* Main nav items */}
        {mainItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
              Administración
            </p>
            {mainItems.map((mod) => {
              const Icon = mod.icon;
              const firstNav = mod.navItems[0];
              const color = ICON_COLOR[mod.category] || ICON_COLOR.core;
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-gray-600"
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                  <span className="truncate text-[11px]">{firstNav?.label || mod.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Portal items */}
        {portalItems.length > 0 && (
          <>
            {mainItems.length > 0 && <div className="my-1.5 border-t border-gray-200" />}
            <div className="space-y-0.5">
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                Portal
              </p>
              {portalItems.map((mod) => {
                const Icon = mod.icon;
                const firstNav = mod.navItems[0];
                return (
                  <div
                    key={mod.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-gray-600"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-cyan-500" />
                    <span className="truncate text-[11px]">{firstNav?.label || mod.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {orderedEnabled.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-gray-400">
            Sin módulos habilitados
          </p>
        )}
      </div>
    </div>
  );
}

function getOrderedEnabled(manifest: ModuleManifest) {
  return ALL_MODULES
    .filter((m) => manifest[m.id]?.enabled)
    .sort((a, b) => (manifest[a.id]?.order ?? 999) - (manifest[b.id]?.order ?? 999));
}
