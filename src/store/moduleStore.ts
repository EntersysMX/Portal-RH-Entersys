import { create } from 'zustand';
import type { ModuleManifest, CustomRole, UserRoleAssignment, PlatformBranding } from '@/modules/types';
import { ALL_MODULES, setManifestGetter } from '@/modules/registry';
import { platformConfigService } from '@/api/services';
import { toast } from '@/components/ui/Toast';

// ============================================
// ROLES POR DEFECTO (sistema)
// ============================================
function allPermissionIds(): string[] {
  return ALL_MODULES.flatMap((m) => m.permissions.map((p) => p.id));
}

/**
 * Solo estos módulos core arrancan habilitados por defecto.
 * Todos los demás inician deshabilitados para que el admin
 * habilite solo los que su empresa necesita.
 */
const ENABLED_BY_DEFAULT = new Set(['dashboard', 'rh', 'portal']);

const DEFAULT_MANIFEST: ModuleManifest = Object.fromEntries(
  ALL_MODULES.map((m, i) => [m.id, { enabled: ENABLED_BY_DEFAULT.has(m.id), order: i }])
);

const DEFAULT_BRANDING: PlatformBranding = {
  companyLogoUrl: null,
  companyName: null,
};

const DEFAULT_ROLES: CustomRole[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso total al sistema, configuración y gestión de usuarios',
    isSystem: true,
    permissions: allPermissionIds(),
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Gestión completa de empleados, nómina, reclutamiento y reportes',
    isSystem: true,
    permissions: allPermissionIds().filter((p) => !p.startsWith('google-sync.')),
  },
  {
    id: 'hr_user',
    name: 'HR User',
    description: 'Operaciones de RH: empleados, asistencia, nómina y organización',
    isSystem: true,
    permissions: [
      'dashboard.read',
      'rh.read', 'rh.create', 'rh.update', 'rh.export',
      'asistencia.read', 'asistencia.create', 'asistencia.update', 'asistencia.export',
      'nomina.read', 'nomina.export',
      'organizacion.read',
      'avisos.read', 'avisos.create',
      'portal.read', 'portal.edit-profile',
    ],
  },
  {
    id: 'employee',
    name: 'Empleado',
    description: 'Portal de autoservicio: perfil, nómina, asistencia y capacitación',
    isSystem: true,
    permissions: ['portal.read', 'portal.edit-profile'],
  },
];

// ============================================
// SEGURIDAD: verificar si el usuario actual es admin
// Importar authStore aquí crearía dependencia circular,
// así que leemos directamente de localStorage (misma fuente de verdad).
// ============================================
function isCurrentUserAdmin(): boolean {
  try {
    const stored = localStorage.getItem('frappe_user');
    if (!stored) return false;
    const user = JSON.parse(stored) as { roles?: string[] };
    const roles = user.roles ?? [];
    return roles.includes('Administrator') || roles.includes('System Manager');
  } catch {
    return false;
  }
}

/** Migra un manifest viejo (sin order) agregando order a cada entry */
function migrateManifest(raw: Record<string, { enabled: boolean; order?: number }>): ModuleManifest {
  let needsMigration = false;
  const migrated: ModuleManifest = {};
  const allIds = ALL_MODULES.map((m) => m.id);

  for (const id of allIds) {
    const entry = raw[id];
    if (entry) {
      if (entry.order === undefined || entry.order === null) {
        needsMigration = true;
        migrated[id] = { enabled: entry.enabled, order: allIds.indexOf(id) };
      } else {
        migrated[id] = { enabled: entry.enabled, order: entry.order };
      }
    } else {
      // Módulo nuevo que no existía en el manifest guardado → deshabilitado por defecto
      needsMigration = true;
      migrated[id] = { enabled: ENABLED_BY_DEFAULT.has(id), order: allIds.indexOf(id) };
    }
  }

  // Persist migration if needed (fire-and-forget, admin only)
  if (needsMigration && isCurrentUserAdmin()) {
    platformConfigService.saveManifest(migrated).catch(() => {});
  }

  return migrated;
}

// ============================================
// STORE
// ============================================
interface ModuleStoreState {
  isInitialized: boolean;
  isLoading: boolean;
  manifest: ModuleManifest;
  branding: PlatformBranding;
  roles: CustomRole[];
  assignments: UserRoleAssignment[];

  /** Carga la configuración desde el backend (todos los usuarios). */
  init: () => Promise<void>;

  // === ACCIONES DE ESCRITURA (solo admin) ===
  toggleModule: (moduleId: string) => Promise<void>;
  setManifest: (manifest: ModuleManifest) => Promise<void>;
  updateModuleOrder: (orderedIds: string[]) => Promise<void>;
  setBranding: (branding: PlatformBranding) => Promise<void>;

  addRole: (role: Omit<CustomRole, 'id' | 'isSystem'>) => Promise<void>;
  updateRole: (id: string, data: Partial<Pick<CustomRole, 'name' | 'description' | 'permissions'>>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  resetRoles: () => Promise<void>;

  setUserRoles: (userEmail: string, userName: string, roleIds: string[]) => Promise<void>;
  removeUserAssignment: (userEmail: string) => Promise<void>;

  // === QUERIES (lectura, todos los usuarios) ===
  getRoleById: (id: string) => CustomRole | undefined;
  getUserRoleIds: (userEmail: string) => string[];
  getPermissionsForRoles: (roleIds: string[]) => Set<string>;
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  manifest: DEFAULT_MANIFEST,
  branding: DEFAULT_BRANDING,
  roles: DEFAULT_ROLES.map((r) => ({ ...r })),
  assignments: [],

  // ========== INIT — lectura desde Frappe (todos los usuarios) ==========
  init: async () => {
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [rawManifest, branding, roles, assignments] = await Promise.all([
        platformConfigService.loadManifest(DEFAULT_MANIFEST),
        platformConfigService.loadBranding(DEFAULT_BRANDING),
        platformConfigService.loadRoles(DEFAULT_ROLES),
        platformConfigService.loadAssignments([]),
      ]);
      const manifest = migrateManifest(rawManifest);
      set({
        manifest,
        branding: branding ?? DEFAULT_BRANDING,
        roles: roles.length > 0 ? roles : DEFAULT_ROLES.map((r) => ({ ...r })),
        assignments,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      // Si falla completamente, usar defaults y no bloquear al usuario
      set({ isInitialized: true, isLoading: false });
    }
  },

  // ========== MODULE ACTIONS (solo admin) ==========
  // Patrón: optimistic update → guardar en BD → si falla, revertir estado
  toggleModule: async (moduleId: string) => {
    if (!isCurrentUserAdmin()) return;
    const previous = get().manifest;
    const existing = previous[moduleId];
    const updated = {
      ...previous,
      [moduleId]: {
        enabled: !existing?.enabled,
        order: existing?.order ?? ALL_MODULES.findIndex((m) => m.id === moduleId),
      },
    };
    set({ manifest: updated });
    try {
      await platformConfigService.saveManifest(updated);
    } catch {
      set({ manifest: previous }); // Revertir
      toast.error('Error al guardar', 'No se pudo guardar en la base de datos. El cambio fue revertido.');
    }
  },

  setManifest: async (manifest: ModuleManifest) => {
    if (!isCurrentUserAdmin()) return;
    const previous = get().manifest;
    set({ manifest });
    try {
      await platformConfigService.saveManifest(manifest);
    } catch {
      set({ manifest: previous }); // Revertir
      toast.error('Error al guardar', 'No se pudo guardar en la base de datos. El cambio fue revertido.');
    }
  },

  updateModuleOrder: async (orderedIds: string[]) => {
    if (!isCurrentUserAdmin()) return;
    const previous = get().manifest;
    const updated = { ...previous };
    orderedIds.forEach((id, index) => {
      if (updated[id]) {
        updated[id] = { ...updated[id], order: index };
      }
    });
    set({ manifest: updated });
    try {
      await platformConfigService.saveManifest(updated);
    } catch {
      set({ manifest: previous }); // Revertir
      toast.error('Error al guardar', 'No se pudo guardar el orden en la base de datos.');
    }
  },

  setBranding: async (branding: PlatformBranding) => {
    if (!isCurrentUserAdmin()) return;
    const previousBranding = get().branding;
    set({ branding });
    try {
      await platformConfigService.saveBranding(branding);
    } catch {
      set({ branding: previousBranding }); // Revertir
      toast.error('Error al guardar', 'No se pudo guardar el branding en la base de datos.');
    }
  },

  // ========== ROLE ACTIONS (solo admin) ==========
  addRole: async (data) => {
    if (!isCurrentUserAdmin()) return;
    const id = `custom_${Date.now()}`;
    const role: CustomRole = { ...data, id, isSystem: false };
    const previousRoles = get().roles;
    const roles = [...previousRoles, role];
    set({ roles });
    try {
      await platformConfigService.saveRoles(roles);
    } catch {
      set({ roles: previousRoles });
      toast.error('Error al guardar', 'No se pudo guardar el rol en la base de datos.');
    }
  },

  updateRole: async (id, data) => {
    if (!isCurrentUserAdmin()) return;
    const previousRoles = get().roles;
    const roles = previousRoles.map((r) =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ roles });
    try {
      await platformConfigService.saveRoles(roles);
    } catch {
      set({ roles: previousRoles });
      toast.error('Error al guardar', 'No se pudo guardar el rol en la base de datos.');
    }
  },

  deleteRole: async (id) => {
    if (!isCurrentUserAdmin()) return;
    const role = get().roles.find((r) => r.id === id);
    if (role?.isSystem) return;
    const previousRoles = get().roles;
    const previousAssignments = get().assignments;
    const roles = previousRoles.filter((r) => r.id !== id);
    const assignments = previousAssignments.map((a) => ({
      ...a,
      customRoleIds: a.customRoleIds.filter((rid) => rid !== id),
    }));
    set({ roles, assignments });
    try {
      await Promise.all([
        platformConfigService.saveRoles(roles),
        platformConfigService.saveAssignments(assignments),
      ]);
    } catch {
      set({ roles: previousRoles, assignments: previousAssignments });
      toast.error('Error al guardar', 'No se pudo guardar en la base de datos.');
    }
  },

  resetRoles: async () => {
    if (!isCurrentUserAdmin()) return;
    const previousRoles = get().roles;
    const roles = DEFAULT_ROLES.map((r) => ({ ...r }));
    set({ roles });
    try {
      await platformConfigService.saveRoles(roles);
    } catch {
      set({ roles: previousRoles });
      toast.error('Error al guardar', 'No se pudo guardar los roles en la base de datos.');
    }
  },

  // ========== ASSIGNMENT ACTIONS (solo admin) ==========
  setUserRoles: async (userEmail, userName, roleIds) => {
    if (!isCurrentUserAdmin()) return;
    const previousAssignments = get().assignments;
    const assignments = previousAssignments.filter((a) => a.userEmail !== userEmail);
    assignments.push({ userEmail, userName, customRoleIds: roleIds });
    set({ assignments });
    try {
      await platformConfigService.saveAssignments(assignments);
    } catch {
      set({ assignments: previousAssignments });
      toast.error('Error al guardar', 'No se pudo guardar las asignaciones en la base de datos.');
    }
  },

  removeUserAssignment: async (userEmail) => {
    if (!isCurrentUserAdmin()) return;
    const previousAssignments = get().assignments;
    const assignments = previousAssignments.filter((a) => a.userEmail !== userEmail);
    set({ assignments });
    try {
      await platformConfigService.saveAssignments(assignments);
    } catch {
      set({ assignments: previousAssignments });
      toast.error('Error al guardar', 'No se pudo guardar las asignaciones en la base de datos.');
    }
  },

  // ========== QUERIES (lectura, todos los usuarios) ==========
  getRoleById: (id) => {
    return get().roles.find((r) => r.id === id);
  },

  getUserRoleIds: (userEmail) => {
    const assignment = get().assignments.find((a) => a.userEmail === userEmail);
    return assignment?.customRoleIds ?? [];
  },

  getPermissionsForRoles: (roleIds) => {
    const roles = get().roles;
    const perms = new Set<string>();
    roleIds.forEach((rid) => {
      const role = roles.find((r) => r.id === rid);
      role?.permissions.forEach((p) => perms.add(p));
    });
    return perms;
  },
}));

// Wire the manifest getter so registry.ts can read from the store without circular imports
setManifestGetter(() => useModuleStore.getState().manifest);
