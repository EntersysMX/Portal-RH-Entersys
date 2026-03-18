import {
  LayoutDashboard, Users, Briefcase, Target, CalendarCheck,
  DollarSign, Calculator, Receipt, GraduationCap, Building2,
  Bell, CloudDownload, Home, User,
} from 'lucide-react';
import type { ModuleDefinition, ModuleManifest } from './types';

// ============================================
// MODULE DEFINITIONS
// ============================================

function makePerms(moduleId: string, labels: Record<string, string>) {
  return Object.entries(labels).map(([action, label]) => ({
    id: `${moduleId}.${action}`,
    label,
  }));
}

function standardPerms(moduleId: string, label: string) {
  return makePerms(moduleId, {
    read: `Ver ${label}`,
    create: `Crear ${label}`,
    update: `Editar ${label}`,
    delete: `Eliminar ${label}`,
    export: `Exportar ${label}`,
  });
}

export const ALL_MODULES: ModuleDefinition[] = [
  // ===== CORE =====
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Panel principal con métricas y KPIs del negocio',
    icon: LayoutDashboard,
    category: 'core',
    sections: ['dashboard'],
    permissions: makePerms('dashboard', { read: 'Ver Dashboard', export: 'Exportar métricas' }),
    navItems: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'dashboard', end: true },
    ],
  },

  // ===== HR =====
  {
    id: 'rh',
    label: 'Recursos Humanos',
    description: 'Gestión de empleados, expedientes y datos laborales',
    icon: Users,
    category: 'hr',
    sections: ['employees', 'employee-detail'],
    permissions: standardPerms('rh', 'empleados'),
    navItems: [
      { label: 'Empleados', path: '/employees', icon: Users, section: 'employees' },
    ],
  },
  {
    id: 'reclutamiento',
    label: 'Reclutamiento',
    description: 'Vacantes, postulantes y pipeline de contratación',
    icon: Briefcase,
    category: 'talent',
    sections: ['recruitment'],
    permissions: standardPerms('reclutamiento', 'vacantes'),
    navItems: [
      { label: 'Reclutamiento', path: '/recruitment', icon: Briefcase, section: 'recruitment' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Evaluaciones de desempeño y objetivos',
    icon: Target,
    category: 'talent',
    sections: ['performance'],
    permissions: standardPerms('performance', 'evaluaciones'),
    navItems: [
      { label: 'Performance', path: '/performance', icon: Target, section: 'performance' },
    ],
  },
  {
    id: 'asistencia',
    label: 'Asistencia',
    description: 'Control de asistencia y registro de jornadas',
    icon: CalendarCheck,
    category: 'hr',
    sections: ['attendance'],
    permissions: standardPerms('asistencia', 'asistencia'),
    navItems: [
      { label: 'Asistencia', path: '/attendance', icon: CalendarCheck, section: 'attendance' },
    ],
  },

  // ===== PAYROLL =====
  {
    id: 'nomina',
    label: 'Nómina',
    description: 'Recibos de nómina, deducciones y procesamiento',
    icon: DollarSign,
    category: 'payroll',
    sections: ['payroll'],
    permissions: [
      ...standardPerms('nomina', 'nómina'),
      { id: 'nomina.process', label: 'Procesar nómina' },
      { id: 'nomina.approve', label: 'Aprobar nómina' },
    ],
    navItems: [
      { label: 'Nómina', path: '/payroll', icon: DollarSign, section: 'payroll' },
    ],
  },
  {
    id: 'nomina-mx',
    label: 'Nómina MX',
    description: 'Timbrado fiscal y complementos de nómina mexicana',
    icon: Calculator,
    category: 'payroll',
    sections: ['nomina-mx'],
    permissions: standardPerms('nomina-mx', 'nómina MX'),
    navItems: [
      { label: 'Nómina MX', path: '/nomina-mx', icon: Calculator, section: 'nomina-mx' },
    ],
  },
  {
    id: 'gastos',
    label: 'Gastos',
    description: 'Solicitudes de reembolso y comprobación de gastos',
    icon: Receipt,
    category: 'payroll',
    sections: ['expenses'],
    permissions: standardPerms('gastos', 'gastos'),
    navItems: [
      { label: 'Gastos', path: '/expenses', icon: Receipt, section: 'expenses' },
    ],
  },

  // ===== TALENT =====
  {
    id: 'capacitacion',
    label: 'Capacitación',
    description: 'Eventos de formación, cursos y certificaciones',
    icon: GraduationCap,
    category: 'talent',
    sections: ['training'],
    permissions: standardPerms('capacitacion', 'capacitaciones'),
    navItems: [
      { label: 'Capacitación', path: '/training', icon: GraduationCap, section: 'training' },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización',
    description: 'Estructura organizacional, departamentos y organigramas',
    icon: Building2,
    category: 'hr',
    sections: ['organization'],
    permissions: makePerms('organizacion', { read: 'Ver organización', update: 'Editar organización' }),
    navItems: [
      { label: 'Organización', path: '/organization', icon: Building2, section: 'organization' },
    ],
  },
  {
    id: 'avisos',
    label: 'Avisos',
    description: 'Tablero de comunicados y notificaciones internas',
    icon: Bell,
    category: 'core',
    sections: ['notices'],
    permissions: standardPerms('avisos', 'avisos'),
    navItems: [
      { label: 'Avisos', path: '/notices', icon: Bell, section: 'notices' },
    ],
  },
  {
    id: 'google-sync',
    label: 'Google Sync',
    description: 'Sincronización con Google Workspace y directorio',
    icon: CloudDownload,
    category: 'admin',
    sections: ['google-sync'],
    permissions: makePerms('google-sync', { read: 'Ver Google Sync', update: 'Configurar Google Sync' }),
    navItems: [
      { label: 'Google Sync', path: '/google-sync', icon: CloudDownload, section: 'google-sync' },
    ],
  },

  // ===== PORTAL EMPLEADO =====
  {
    id: 'portal',
    label: 'Portal Empleado',
    description: 'Autoservicio para empleados: perfil, nómina, asistencia',
    icon: Home,
    category: 'portal',
    sections: ['portal', 'my-profile', 'my-payslips', 'my-attendance', 'my-training', 'my-organization', 'my-notices'],
    permissions: makePerms('portal', { read: 'Acceder al portal', 'edit-profile': 'Editar mi perfil' }),
    navItems: [
      { label: 'Mi Portal', path: '/portal', icon: Home, section: 'portal', end: true },
      { label: 'Mi Perfil', path: '/portal/profile', icon: User, section: 'my-profile' },
      { label: 'Mi Nómina', path: '/portal/payslips', icon: DollarSign, section: 'my-payslips' },
      { label: 'Mi Asistencia', path: '/portal/attendance', icon: CalendarCheck, section: 'my-attendance' },
      { label: 'Capacitación', path: '/portal/training', icon: GraduationCap, section: 'my-training' },
      { label: 'Organigrama', path: '/portal/organization', icon: Building2, section: 'my-organization' },
      { label: 'Avisos', path: '/portal/notices', icon: Bell, section: 'my-notices' },
    ],
  },
];

// ============================================
// MANIFEST MANAGEMENT
// Lee el manifiesto desde el Zustand store
// (que lo carga desde el backend de Frappe).
// Evitamos importar el store directamente para
// no crear dependencia circular; en su lugar
// usamos un puntero que el store setea al crearse.
// ============================================

/** Puntero al getter del manifest — lo setea moduleStore al inicializarse */
let _manifestGetter: (() => ModuleManifest) | null = null;

export function setManifestGetter(fn: () => ModuleManifest): void {
  _manifestGetter = fn;
}

function getManifest(): ModuleManifest {
  if (_manifestGetter) return _manifestGetter();
  // Fallback: todos habilitados con orden por defecto
  return Object.fromEntries(ALL_MODULES.map((m, i) => [m.id, { enabled: true, order: i }]));
}

export function isModuleEnabled(moduleId: string): boolean {
  return getManifest()[moduleId]?.enabled ?? false;
}

/** Returns only modules that are enabled in the manifest, sorted by order */
export function getEnabledModules(): ModuleDefinition[] {
  const manifest = getManifest();
  return ALL_MODULES
    .filter((m) => manifest[m.id]?.enabled)
    .sort((a, b) => (manifest[a.id]?.order ?? 999) - (manifest[b.id]?.order ?? 999));
}

/** Check if a section belongs to an enabled module */
export function isSectionEnabled(section: string): boolean {
  const manifest = getManifest();
  // Admin sections are always enabled
  if (section === 'settings' || section.startsWith('admin-')) return true;
  return ALL_MODULES.some(
    (m) => manifest[m.id]?.enabled && m.sections.includes(section)
  );
}

/** Get the module that owns a section */
export function getModuleBySection(section: string): ModuleDefinition | undefined {
  return ALL_MODULES.find((m) => m.sections.includes(section));
}

/** Get all unique permissions across all modules */
export function getAllPermissions(): { moduleId: string; moduleLabel: string; permissions: { id: string; label: string }[] }[] {
  return ALL_MODULES
    .filter((m) => m.category !== 'portal')
    .map((m) => ({
      moduleId: m.id,
      moduleLabel: m.label,
      permissions: m.permissions,
    }));
}
