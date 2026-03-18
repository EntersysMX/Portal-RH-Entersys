import type { LucideIcon } from 'lucide-react';

// ============================================
// MODULE SYSTEM TYPES
// ============================================

/** Definición completa de un módulo de la plataforma */
export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  /** Texto largo con explicación detallada del módulo (para modal de info) */
  details?: string;
  icon: LucideIcon;
  category: 'core' | 'hr' | 'payroll' | 'talent' | 'admin' | 'portal';
  /** Secciones de MenuSection que este módulo posee */
  sections: string[];
  /** Permisos disponibles dentro de este módulo */
  permissions: ModulePermission[];
  /** Entradas de navegación para el sidebar */
  navItems: ModuleNavItem[];
}

/** Permiso granular de un módulo (e.g. rh.read, rh.create) */
export interface ModulePermission {
  id: string;
  label: string;
}

/** Entrada de navegación del sidebar */
export interface ModuleNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  section: string;
  end?: boolean;
}

/** Manifiesto: qué módulos están habilitados en este despliegue */
export interface ModuleManifest {
  [moduleId: string]: { enabled: boolean; order: number };
}

/** Branding de la empresa (logo + nombre) */
export interface PlatformBranding {
  companyLogoUrl: string | null;
  companyName: string | null;
}

/** Preferencias de sidebar por usuario (localStorage) */
export interface UserSidebarPreferences {
  moduleOrder: string[];
  lastAdminOrderVersion: number;
}

/** Rol personalizado configurable desde el panel de admin */
export interface CustomRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

/** Asignación de roles personalizados a un usuario */
export interface UserRoleAssignment {
  userEmail: string;
  userName: string;
  customRoleIds: string[];
}
