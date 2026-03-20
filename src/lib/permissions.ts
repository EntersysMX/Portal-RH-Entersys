import { isSectionEnabled } from '@/modules/registry';

// ============================================
// SISTEMA DE PERMISOS (RBAC)
// ============================================

// Roles de Frappe HR que reconocemos
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  SYSTEM_MANAGER: 'System Manager',
  HR_MANAGER: 'HR Manager',
  HR_USER: 'HR User',
  EMPLOYEE: 'Employee',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Perfiles de usuario (agrupaciones lógicas de roles)
export type UserProfile = 'admin' | 'hr_manager' | 'hr_user' | 'employee';

// Secciones del menú
export type MenuSection =
  | 'dashboard'
  | 'employees'
  | 'employee-detail'
  | 'recruitment'
  | 'performance'
  | 'attendance'
  | 'payroll'
  | 'nomina-mx'
  | 'nomina-usa'
  | 'nomina-col'
  | 'expenses'
  | 'training'
  | 'organization'
  | 'settings'
  | 'notices'
  | 'google-sync'
  | 'leave-management'
  // HR Extended
  | 'surveys'
  | 'work-climate'
  | 'disabilities'
  | 'discipline'
  | 'turnover'
  | 'people-analytics'
  | 'equipment'
  | 'onboarding'
  // Payroll Extended
  | 'loans'
  | 'savings-fund'
  | 'travel'
  | 'benefits'
  // HR Operations
  | 'movements'
  | 'separations'
  | 'shifts'
  | 'checkins'
  | 'grievances'
  | 'skills'
  // Admin panel
  | 'admin-modules'
  | 'admin-roles'
  | 'admin-users'
  | 'admin-catalogs'
  | 'admin-platform'
  | 'admin-demo-data'
  // Portal de empleado
  | 'portal'
  | 'my-profile'
  | 'my-payslips'
  | 'my-attendance'
  | 'my-training'
  | 'my-organization'
  | 'my-notices';

// Acciones disponibles
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';

// Matriz de permisos: qué secciones puede ver cada perfil
const PROFILE_MENU_ACCESS: Record<UserProfile, MenuSection[]> = {
  admin: [
    'dashboard', 'employees', 'employee-detail', 'recruitment', 'performance',
    'attendance', 'leave-management', 'payroll', 'nomina-mx', 'nomina-usa', 'nomina-col', 'expenses',
    'training', 'organization', 'settings', 'notices', 'google-sync',
    // HR Extended
    'surveys', 'work-climate', 'disabilities', 'discipline',
    'turnover', 'people-analytics', 'equipment', 'onboarding',
    // Payroll Extended
    'loans', 'savings-fund', 'travel', 'benefits',
    // HR Operations
    'movements', 'separations', 'shifts', 'checkins', 'grievances', 'skills',
    // Admin panel
    'admin-modules', 'admin-roles', 'admin-users', 'admin-catalogs', 'admin-platform', 'admin-demo-data',
    // Admin también puede ver el portal
    'portal', 'my-profile', 'my-payslips', 'my-attendance',
    'my-training', 'my-organization', 'my-notices',
  ],
  hr_manager: [
    'dashboard', 'employees', 'employee-detail', 'recruitment', 'performance',
    'attendance', 'leave-management', 'payroll', 'nomina-mx', 'nomina-usa', 'nomina-col', 'expenses',
    'training', 'organization', 'notices',
    // HR Extended
    'surveys', 'work-climate', 'disabilities', 'discipline',
    'turnover', 'people-analytics', 'equipment', 'onboarding',
    // Payroll Extended
    'loans', 'savings-fund', 'travel', 'benefits',
    // HR Operations
    'movements', 'separations', 'shifts', 'checkins', 'grievances', 'skills',
    'portal', 'my-profile', 'my-payslips', 'my-attendance',
    'my-training', 'my-organization', 'my-notices',
  ],
  hr_user: [
    'dashboard', 'employees', 'employee-detail', 'attendance', 'leave-management', 'payroll', 'organization', 'notices',
    // HR Extended (limited)
    'surveys', 'disabilities', 'discipline', 'equipment', 'onboarding',
    // Payroll Extended (limited)
    'loans', 'savings-fund', 'travel', 'benefits',
    // HR Operations (limited)
    'movements', 'separations', 'shifts', 'checkins', 'grievances', 'skills',
    'portal', 'my-profile', 'my-payslips', 'my-attendance',
    'my-training', 'my-organization', 'my-notices',
  ],
  employee: [
    'portal', 'my-profile', 'my-payslips', 'my-attendance',
    'my-training', 'my-organization', 'my-notices',
  ],
};

// Acciones por perfil por sección
const PROFILE_ACTIONS: Record<UserProfile, Record<string, Action[]>> = {
  admin: {
    '*': ['view', 'create', 'edit', 'delete', 'export'],
  },
  hr_manager: {
    '*': ['view', 'create', 'edit', 'delete', 'export'],
    settings: ['view'],
  },
  hr_user: {
    '*': ['view', 'create', 'edit', 'export'],
    employees: ['view', 'edit', 'export'],
  },
  employee: {
    '*': ['view'],
    'my-profile': ['view', 'edit'],
  },
};

/**
 * Determina el perfil del usuario basado en sus roles de Frappe.
 * Usa el perfil más privilegiado disponible.
 */
export function getUserProfile(roles: string[]): UserProfile {
  if (roles.includes(ROLES.ADMINISTRATOR) || roles.includes(ROLES.SYSTEM_MANAGER)) {
    return 'admin';
  }
  if (roles.includes(ROLES.HR_MANAGER)) {
    return 'hr_manager';
  }
  if (roles.includes(ROLES.HR_USER)) {
    return 'hr_user';
  }
  return 'employee';
}

/**
 * Verifica si el usuario puede ver una sección del menú.
 * Ahora también verifica que el módulo esté habilitado.
 */
export function canAccessSection(roles: string[], section: MenuSection): boolean {
  // Primero verificar si el módulo que contiene esta sección está habilitado
  if (!isSectionEnabled(section)) return false;

  const profile = getUserProfile(roles);
  return PROFILE_MENU_ACCESS[profile].includes(section);
}

/**
 * Verifica si el usuario puede realizar una acción en una sección.
 */
export function canPerformAction(roles: string[], section: MenuSection, action: Action): boolean {
  if (!isSectionEnabled(section)) return false;

  const profile = getUserProfile(roles);
  const actions = PROFILE_ACTIONS[profile];

  // Buscar acciones específicas de la sección
  const sectionActions = actions[section] || actions['*'];
  if (!sectionActions) return false;
  return sectionActions.includes(action);
}

/**
 * Obtiene las secciones del menú visibles para el usuario.
 * Filtrado por módulos habilitados.
 */
export function getVisibleSections(roles: string[]): MenuSection[] {
  const profile = getUserProfile(roles);
  return PROFILE_MENU_ACCESS[profile].filter((s) => isSectionEnabled(s));
}

/**
 * Helpers rápidos basados en roles
 */
export function isAdmin(roles: string[]): boolean {
  return roles.includes(ROLES.ADMINISTRATOR) || roles.includes(ROLES.SYSTEM_MANAGER);
}

export function isHR(roles: string[]): boolean {
  return roles.includes(ROLES.HR_MANAGER) || roles.includes(ROLES.HR_USER);
}

export function isEmployeeOnly(roles: string[]): boolean {
  return !isAdmin(roles) && !isHR(roles);
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Obtiene la ruta de inicio según el perfil del usuario.
 */
export function getHomePath(roles: string[]): string {
  if (isEmployeeOnly(roles)) return '/portal';
  return '/';
}

/**
 * Label del perfil para mostrar en la UI
 */
export function getProfileLabel(roles: string[]): string {
  const profile = getUserProfile(roles);
  const labels: Record<UserProfile, string> = {
    admin: 'Administrador',
    hr_manager: 'HR Manager',
    hr_user: 'HR User',
    employee: 'Empleado',
  };
  return labels[profile];
}

/**
 * Color del badge del perfil
 */
export function getProfileBadgeColor(roles: string[]): string {
  const profile = getUserProfile(roles);
  const colors: Record<UserProfile, string> = {
    admin: 'bg-red-100 text-red-700',
    hr_manager: 'bg-purple-100 text-purple-700',
    hr_user: 'bg-blue-100 text-blue-700',
    employee: 'bg-green-100 text-green-700',
  };
  return colors[profile];
}
