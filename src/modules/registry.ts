import {
  LayoutDashboard, Users, Briefcase, Target, CalendarCheck,
  DollarSign, Calculator, Receipt, GraduationCap, Building2,
  Bell, Home, User, Landmark, Globe,
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
    details: 'El Dashboard centraliza los indicadores clave de la organización: headcount, rotación, costos de nómina, vacantes abiertas y asistencia. Permite exportar las métricas a Excel para reportes ejecutivos.',
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
    label: 'Empleados',
    description: 'Gestión de empleados, expedientes y datos laborales',
    details: 'Módulo central de capital humano. Permite crear, editar y consultar expedientes de empleados, gestionar documentos, historial laboral, movimientos (altas, bajas, cambios de puesto) y carga masiva vía Excel con validación automática de catálogos.',
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
    details: 'Gestiona el ciclo completo de reclutamiento: publicación de vacantes, recepción de postulantes, seguimiento del pipeline de contratación por etapas (aplicado, entrevista, oferta, contratado) y estadísticas de conversión.',
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
    details: 'Sistema de evaluaciones de desempeño con ciclos configurables, formularios de autoevaluación, evaluación por gerente, seguimiento de objetivos (OKR) y reportes de distribución de calificaciones.',
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
    details: 'Control de asistencia con registro de checadas (entrada/salida), cálculo automático de horas trabajadas, gestión de turnos, detección de retardos e inasistencias, y reportes de puntualidad.',
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
    details: 'Módulo base de nómina: procesamiento de períodos de pago, generación de recibos, cálculo de percepciones y deducciones, aprobación de nómina y exportación de layouts bancarios para dispersión.',
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
    details: 'Motor completo de nómina mexicana: cálculo de ISR (Art. 96 LISR), cuotas IMSS (patronal y obrera), SDI con factor de integración, ISN estatal, INFONAVIT, subsidio al empleo, CFDI de nómina 4.0, prestaciones (aguinaldo, prima vacacional, PTU) y proyecciones financieras a 12 meses.',
    icon: Calculator,
    category: 'payroll',
    sections: ['nomina-mx'],
    permissions: standardPerms('nomina-mx', 'nómina MX'),
    navItems: [
      { label: 'Nómina MX', path: '/nomina-mx', icon: Calculator, section: 'nomina-mx' },
    ],
  },
  {
    id: 'nomina-usa',
    label: 'Nómina USA',
    description: 'Payroll estadounidense: Federal Tax, FICA, State Tax',
    details: 'Motor de cálculo de payroll estadounidense con brackets federales 2024 (10%–37%), FICA (Social Security 6.2% + Medicare 1.45%), Additional Medicare Tax (0.9% sobre $200k), impuesto estatal configurable, deducciones pre-tax (401k, seguro médico), deducción estándar por filing status y proyección anual.',
    icon: Landmark,
    category: 'payroll',
    sections: ['nomina-usa'],
    permissions: standardPerms('nomina-usa', 'nómina USA'),
    navItems: [
      { label: 'Nómina USA', path: '/nomina-usa', icon: Landmark, section: 'nomina-usa' },
    ],
  },
  {
    id: 'nomina-col',
    label: 'Nómina COL',
    description: 'Nómina colombiana: retención, seguridad social, prestaciones',
    details: 'Motor de cálculo de nómina colombiana: retención en la fuente (Art. 383 ET, tabla UVT 2024), seguridad social (EPS 12.5%, AFP 16%, ARL niveles I–V), parafiscales (SENA 2%, ICBF 3%, CCF 4%), prestaciones sociales (prima de servicios, cesantías, intereses sobre cesantías, vacaciones) y dotación.',
    icon: Globe,
    category: 'payroll',
    sections: ['nomina-col'],
    permissions: standardPerms('nomina-col', 'nómina COL'),
    navItems: [
      { label: 'Nómina COL', path: '/nomina-col', icon: Globe, section: 'nomina-col' },
    ],
  },
  {
    id: 'gastos',
    label: 'Gastos',
    description: 'Solicitudes de reembolso y comprobación de gastos',
    details: 'Gestión de gastos corporativos: solicitudes de reembolso, adjuntar comprobantes, flujo de aprobación por niveles, políticas de gasto configurables y reportes de comprobación.',
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
    details: 'Planificación y seguimiento de capacitación: creación de eventos de formación, asignación de participantes, registro de asistencia, tracking de certificaciones y reportes de horas de capacitación por empleado.',
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
    details: 'Visualización y gestión de la estructura organizacional: organigramas interactivos, gestión de departamentos, centros de costo, y reportes de distribución de personal por área.',
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
    details: 'Tablero de comunicación interna: publicación de avisos y comunicados, segmentación por departamento o empresa, programación de publicaciones y confirmación de lectura por parte de los empleados.',
    icon: Bell,
    category: 'core',
    sections: ['notices'],
    permissions: standardPerms('avisos', 'avisos'),
    navItems: [
      { label: 'Avisos', path: '/notices', icon: Bell, section: 'notices' },
    ],
  },
  // ===== PORTAL EMPLEADO =====
  {
    id: 'portal',
    label: 'Portal Empleado',
    description: 'Autoservicio para empleados: perfil, nómina, asistencia',
    details: 'Portal de autoservicio para empleados: consulta y edición de perfil personal, descarga de recibos de nómina, visualización de asistencia, acceso a capacitaciones, organigrama y avisos internos. No requiere permisos de administrador.',
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
  if (section === 'settings' || section === 'google-sync' || section.startsWith('admin-')) return true;
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
