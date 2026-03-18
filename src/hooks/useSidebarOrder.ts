import { useMemo, useCallback } from 'react';
import { getEnabledModules } from '@/modules/registry';
import { useModuleStore } from '@/store/moduleStore';
import { useAuthStore } from '@/store/authStore';
import { loadUserPrefs, saveUserPrefs, clearUserPrefs } from '@/lib/sidebarPreferences';
import type { ModuleDefinition } from '@/modules/types';

/**
 * Hook que fusiona el orden de admin (manifest) con las preferencias del usuario (localStorage).
 * Prioridad: user prefs → admin order → static default.
 *
 * Solo reordena — no habilita/deshabilita módulos.
 */
export function useSidebarOrder() {
  const manifest = useModuleStore((s) => s.manifest);
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? '';

  const orderedModules: ModuleDefinition[] = useMemo(() => {
    const enabled = getEnabledModules(); // already sorted by admin order

    if (!email) return enabled;

    const prefs = loadUserPrefs(email);
    if (!prefs || prefs.moduleOrder.length === 0) return enabled;

    // Build a map for fast lookup
    const moduleMap = new Map(enabled.map((m) => [m.id, m]));

    // Reorder: put modules in user's preferred order, append any new modules at the end
    const ordered: ModuleDefinition[] = [];
    const seen = new Set<string>();

    for (const id of prefs.moduleOrder) {
      const mod = moduleMap.get(id);
      if (mod) {
        ordered.push(mod);
        seen.add(id);
      }
    }

    // Append modules not in user prefs (newly added by admin)
    for (const mod of enabled) {
      if (!seen.has(mod.id)) {
        ordered.push(mod);
      }
    }

    return ordered;
  }, [manifest, email]);

  const reorderModules = useCallback((newOrder: string[]) => {
    if (!email) return;
    saveUserPrefs(email, {
      moduleOrder: newOrder,
      lastAdminOrderVersion: Date.now(),
    });
    // Force re-render by touching manifest subscription
    // (the manifest didn't change, but we need useMemo to recompute)
    // We'll use a simple state trigger via the store
    useModuleStore.setState((s) => ({ manifest: { ...s.manifest } }));
  }, [email]);

  const resetToDefault = useCallback(() => {
    if (!email) return;
    clearUserPrefs(email);
    useModuleStore.setState((s) => ({ manifest: { ...s.manifest } }));
  }, [email]);

  return { orderedModules, reorderModules, resetToDefault };
}
