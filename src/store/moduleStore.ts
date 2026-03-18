import { create } from 'zustand';
import type { ModuleManifest, CustomRole, UserRoleAssignment } from '@/modules/types';
import { ALL_MODULES, setManifestGetter } from '@/modules/registry';
import { platformConfigService } from '@/api/services';

// ============================================
// ROLES POR DEFECTO (sistema)
// ============================================
function allPermissionIds(): string[] {
  return ALL_MODULES.flatMap((m) => m.permissions.map((p) => p.id));
}

const DEFAULT_MANIFEST: ModuleManifest = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, { enabled: true }])
);

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
// STORE
// ============================================
interface ModuleStoreState {
  isInitialized: boolean;
  isLoading: boolean;
  manifest: ModuleManifest;
  roles: CustomRole[];
  assignments: UserRoleAssignment[];

  /** Carga la configuración desde el backend de Frappe */
  init: () => Promise<void>;

  // Module actions (async — persisten en BD)
  toggleModule: (moduleId: string) => Promise<void>;
  setManifest: (manifest: ModuleManifest) => Promise<void>;

  // Role actions (async — persisten en BD)
  addRole: (role: Omit<CustomRole, 'id' | 'isSystem'>) => Promise<void>;
  updateRole: (id: string, data: Partial<Pick<CustomRole, 'name' | 'description' | 'permissions'>>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  resetRoles: () => Promise<void>;

  // Assignment actions (async — persisten en BD)
  setUserRoles: (userEmail: string, userName: string, roleIds: string[]) => Promise<void>;
  removeUserAssignment: (userEmail: string) => Promise<void>;

  // Queries (sync — leen del state)
  getRoleById: (id: string) => CustomRole | undefined;
  getUserRoleIds: (userEmail: string) => string[];
  getPermissionsForRoles: (roleIds: string[]) => Set<string>;
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  manifest: DEFAULT_MANIFEST,
  roles: DEFAULT_ROLES.map((r) => ({ ...r })),
  assignments: [],

  // ========== INIT — carga desde Frappe ==========
  init: async () => {
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [manifest, roles, assignments] = await Promise.all([
        platformConfigService.loadManifest(DEFAULT_MANIFEST),
        platformConfigService.loadRoles(DEFAULT_ROLES),
        platformConfigService.loadAssignments([]),
      ]);
      set({
        manifest: { ...DEFAULT_MANIFEST, ...manifest },
        roles: roles.length > 0 ? roles : DEFAULT_ROLES.map((r) => ({ ...r })),
        assignments,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      // Si falla, usar defaults y marcar como inicializado
      set({ isInitialized: true, isLoading: false });
    }
  },

  // ========== MODULE ACTIONS ==========
  toggleModule: async (moduleId: string) => {
    const current = get().manifest;
    const updated = {
      ...current,
      [moduleId]: { enabled: !current[moduleId]?.enabled },
    };
    set({ manifest: updated });
    await platformConfigService.saveManifest(updated).catch(() => {});
  },

  setManifest: async (manifest: ModuleManifest) => {
    set({ manifest });
    await platformConfigService.saveManifest(manifest).catch(() => {});
  },

  // ========== ROLE ACTIONS ==========
  addRole: async (data) => {
    const id = `custom_${Date.now()}`;
    const role: CustomRole = { ...data, id, isSystem: false };
    const roles = [...get().roles, role];
    set({ roles });
    await platformConfigService.saveRoles(roles).catch(() => {});
  },

  updateRole: async (id, data) => {
    const roles = get().roles.map((r) =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ roles });
    await platformConfigService.saveRoles(roles).catch(() => {});
  },

  deleteRole: async (id) => {
    const role = get().roles.find((r) => r.id === id);
    if (role?.isSystem) return;
    const roles = get().roles.filter((r) => r.id !== id);
    // Limpiar asignaciones que usen este rol
    const assignments = get().assignments.map((a) => ({
      ...a,
      customRoleIds: a.customRoleIds.filter((rid) => rid !== id),
    }));
    set({ roles, assignments });
    await Promise.all([
      platformConfigService.saveRoles(roles),
      platformConfigService.saveAssignments(assignments),
    ]).catch(() => {});
  },

  resetRoles: async () => {
    const roles = DEFAULT_ROLES.map((r) => ({ ...r }));
    set({ roles });
    await platformConfigService.saveRoles(roles).catch(() => {});
  },

  // ========== ASSIGNMENT ACTIONS ==========
  setUserRoles: async (userEmail, userName, roleIds) => {
    const assignments = get().assignments.filter((a) => a.userEmail !== userEmail);
    assignments.push({ userEmail, userName, customRoleIds: roleIds });
    set({ assignments });
    await platformConfigService.saveAssignments(assignments).catch(() => {});
  },

  removeUserAssignment: async (userEmail) => {
    const assignments = get().assignments.filter((a) => a.userEmail !== userEmail);
    set({ assignments });
    await platformConfigService.saveAssignments(assignments).catch(() => {});
  },

  // ========== QUERIES (sync) ==========
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
