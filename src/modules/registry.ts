import {
  LayoutDashboard, Users, Briefcase, Target, CalendarCheck,
  DollarSign, Calculator, Receipt, GraduationCap, Building2,
  Bell, Home, User, Landmark, Globe,
  ClipboardList, HeartHandshake, ShieldPlus, Scale,
  ArrowLeftRight, PieChart, HardHat, UserCheck,
  Banknote, PiggyBank, Plane, Gift, ArrowUpDown,
  UserX, Clock, Fingerprint, MessageSquareWarning, Star,
  CalendarX2, FileText,
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

  {
    id: 'vacaciones',
    label: 'Vacaciones',
    description: 'Gestión integral de vacaciones, permisos y días festivos',
    details: 'Módulo completo de gestión de ausencias: solicitudes de permiso, tipos de permiso, asignación de días, políticas de vacaciones, días festivos, permisos compensatorios y liquidación de vacaciones. Centraliza todo lo relacionado con ausencias del personal.',
    icon: CalendarX2,
    category: 'hr',
    sections: ['leave-management'],
    permissions: standardPerms('vacaciones', 'vacaciones'),
    navItems: [
      { label: 'Vacaciones', path: '/leave-management', icon: CalendarX2, section: 'leave-management' },
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
  // ===== HR EXTENDED =====
  {
    id: 'encuestas',
    label: 'Encuestas',
    description: 'Motor genérico de encuestas configurables para la empresa',
    details: 'Motor genérico de encuestas configurables: N preguntas (abiertas, opción múltiple, escala Likert 1-5), asignar a departamentos o toda la empresa, anonimato configurable, fecha de vencimiento, dashboard de resultados con tasa de participación y distribución de respuestas.',
    icon: ClipboardList,
    category: 'hr',
    sections: ['surveys'],
    permissions: standardPerms('encuestas', 'encuestas'),
    navItems: [
      { label: 'Encuestas', path: '/surveys', icon: ClipboardList, section: 'surveys' },
    ],
  },
  {
    id: 'clima-laboral',
    label: 'Clima Laboral',
    description: 'Dashboard de clima laboral con métricas de satisfacción',
    details: 'Panel especializado de clima laboral con plantillas pre-configuradas por categorías (Ambiente de Trabajo, Comunicación, Liderazgo, Desarrollo Profesional, Compensación), dashboard con promedios, tendencias mensuales, comparativos por departamento y alertas de áreas que requieren atención.',
    icon: HeartHandshake,
    category: 'talent',
    sections: ['work-climate'],
    permissions: makePerms('clima-laboral', { read: 'Ver clima laboral', export: 'Exportar reportes' }),
    navItems: [
      { label: 'Clima Laboral', path: '/work-climate', icon: HeartHandshake, section: 'work-climate' },
    ],
  },
  {
    id: 'incapacidades',
    label: 'Incapacidades',
    description: 'Control de incapacidades médicas y seguimiento',
    details: 'Control de incapacidades médicas: registro por tipo (enfermedad general, riesgo de trabajo, maternidad/paternidad), folio IMSS o certificado médico, seguimiento de días y costos estimados, dashboard con incapacidades activas, total de días perdidos y tendencia mensual.',
    icon: ShieldPlus,
    category: 'hr',
    sections: ['disabilities'],
    permissions: standardPerms('incapacidades', 'incapacidades'),
    navItems: [
      { label: 'Incapacidades', path: '/disabilities', icon: ShieldPlus, section: 'disabilities' },
    ],
  },
  {
    id: 'disciplina',
    label: 'Disciplina',
    description: 'Gestión de amonestaciones y actas administrativas',
    details: 'Gestión de amonestaciones y actas administrativas con escalamiento progresivo: amonestación verbal, escrita 1, escrita 2, suspensión 1 día, suspensión 3 días. Categorías configurables (EPP, inocuidad, conducta, puntualidad), historial completo por empleado y reporte de tendencias.',
    icon: Scale,
    category: 'hr',
    sections: ['discipline'],
    permissions: standardPerms('disciplina', 'disciplina'),
    navItems: [
      { label: 'Disciplina', path: '/discipline', icon: Scale, section: 'discipline' },
    ],
  },
  {
    id: 'rotacion',
    label: 'Rotación y Retención',
    description: 'Dashboard ejecutivo de rotación y retención de personal',
    details: 'Dashboard ejecutivo de rotación y retención. Calcula tasas de rotación, compara altas vs bajas por mes y departamento, desglosa motivos de baja (renuncia, despido, jubilación, abandono), muestra duración promedio del empleado y permite comparar indicadores entre años.',
    icon: ArrowLeftRight,
    category: 'talent',
    sections: ['turnover'],
    permissions: makePerms('rotacion', { read: 'Ver rotación', export: 'Exportar reportes' }),
    navItems: [
      { label: 'Rotación', path: '/turnover', icon: ArrowLeftRight, section: 'turnover' },
    ],
  },
  {
    id: 'people-analytics',
    label: 'People Analytics',
    description: 'Panel avanzado de analítica de personas para dirección',
    details: 'Panel avanzado de People Analytics para dirección y RRHH. Indicadores demográficos (distribución por género, rangos de edad, antigüedad promedio), indicadores financieros (costo planilla, sueldo promedio por departamento y género), distribución por área y análisis de equidad salarial.',
    icon: PieChart,
    category: 'talent',
    sections: ['people-analytics'],
    permissions: makePerms('people-analytics', { read: 'Ver People Analytics', export: 'Exportar reportes' }),
    navItems: [
      { label: 'People Analytics', path: '/people-analytics', icon: PieChart, section: 'people-analytics' },
    ],
  },
  {
    id: 'equipamiento',
    label: 'Equipamiento',
    description: 'Control de equipamiento y activos asignados al personal',
    details: 'Control de equipamiento y activos asignados: EPP (equipo de protección personal), uniformes, herramientas y equipo de cómputo. Registro de asignación y devolución con fechas, seguimiento de equipo pendiente de devolver en bajas y catálogo configurable de tipos de equipo.',
    icon: HardHat,
    category: 'hr',
    sections: ['equipment'],
    permissions: standardPerms('equipamiento', 'equipamiento'),
    navItems: [
      { label: 'Equipamiento', path: '/equipment', icon: HardHat, section: 'equipment' },
    ],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'Gestión de procesos de integración y salida de personal',
    details: 'Gestión de procesos de integración (onboarding) y salida (offboarding) con checklists configurables. Onboarding: documentos, cuentas, equipo, capacitación inicial. Offboarding: devolución de equipo, desactivación de accesos, entrevista de salida. Seguimiento visual con barra de progreso.',
    icon: UserCheck,
    category: 'hr',
    sections: ['onboarding'],
    permissions: standardPerms('onboarding', 'onboarding'),
    navItems: [
      { label: 'Onboarding', path: '/onboarding', icon: UserCheck, section: 'onboarding' },
    ],
  },

  {
    id: 'documentos',
    label: 'Documentos',
    description: 'Plantillas de documentos HR con generación automática',
    details: 'Crea plantillas de contratos, cartas de recomendación, constancias, actas y memorándums con placeholders que se llenan automáticamente con datos del empleado. Selecciona un empleado, previsualiza el documento completo e imprímelo directamente.',
    icon: FileText,
    category: 'hr',
    sections: ['documents'],
    permissions: standardPerms('documentos', 'documentos'),
    navItems: [
      { label: 'Documentos', path: '/documents', icon: FileText, section: 'documents' },
    ],
  },

  // ===== PAYROLL EXTENDED =====
  {
    id: 'prestamos',
    label: 'Préstamos',
    description: 'Gestión de préstamos a empleados y solicitudes',
    details: 'Control de préstamos a empleados: solicitudes, aprobación, desembolso, calendario de pagos, seguimiento de saldos pendientes y reportes de cartera de préstamos activos.',
    icon: Banknote,
    category: 'payroll',
    sections: ['loans'],
    permissions: standardPerms('prestamos', 'préstamos'),
    navItems: [
      { label: 'Préstamos', path: '/loans', icon: Banknote, section: 'loans' },
    ],
  },
  {
    id: 'fondo-ahorro',
    label: 'Fondo de Ahorro',
    description: 'Caja de ahorro y fondo de ahorro para empleados',
    details: 'Gestión de fondo de ahorro empresarial: aportaciones periódicas del empleado y la empresa, rendimientos, retiros parciales o totales, estados de cuenta individuales y reportes de saldos globales.',
    icon: PiggyBank,
    category: 'payroll',
    sections: ['savings-fund'],
    permissions: standardPerms('fondo-ahorro', 'fondo de ahorro'),
    navItems: [
      { label: 'Fondo de Ahorro', path: '/savings-fund', icon: PiggyBank, section: 'savings-fund' },
    ],
  },
  {
    id: 'viaticos',
    label: 'Viáticos',
    description: 'Solicitudes de viaje y control de viáticos',
    details: 'Gestión de viáticos y solicitudes de viaje: solicitud con itinerario y costos estimados, flujo de aprobación, anticipo de viáticos, comprobación post-viaje y reportes de gastos de viaje por empleado y departamento.',
    icon: Plane,
    category: 'payroll',
    sections: ['travel'],
    permissions: standardPerms('viaticos', 'viáticos'),
    navItems: [
      { label: 'Viáticos', path: '/travel', icon: Plane, section: 'travel' },
    ],
  },
  {
    id: 'prestaciones',
    label: 'Prestaciones',
    description: 'Gestión de prestaciones y beneficios del personal',
    details: 'Administración de prestaciones: aguinaldo, prima vacacional, vales de despensa, seguro de vida, seguro de gastos médicos mayores, fondo de ahorro, bonos y prestaciones superiores a la ley. Control por empleado con montos y vigencias.',
    icon: Gift,
    category: 'payroll',
    sections: ['benefits'],
    permissions: standardPerms('prestaciones', 'prestaciones'),
    navItems: [
      { label: 'Prestaciones', path: '/benefits', icon: Gift, section: 'benefits' },
    ],
  },

  // ===== HR OPERATIONS =====
  {
    id: 'movimientos',
    label: 'Movimientos',
    description: 'Promociones y transferencias de personal',
    details: 'Registro de movimientos de personal: promociones (cambio de puesto, ajuste salarial), transferencias entre departamentos o sucursales, historial completo de cambios por empleado y reportes de movilidad interna.',
    icon: ArrowUpDown,
    category: 'hr',
    sections: ['movements'],
    permissions: standardPerms('movimientos', 'movimientos'),
    navItems: [
      { label: 'Movimientos', path: '/movements', icon: ArrowUpDown, section: 'movements' },
    ],
  },
  {
    id: 'separaciones',
    label: 'Separaciones',
    description: 'Procesos de baja y separación de empleados',
    details: 'Gestión formal de bajas: carta de renuncia, proceso de separación con checklist, entrevista de salida, cálculo de finiquito/liquidación, devolución de activos y desactivación de accesos.',
    icon: UserX,
    category: 'hr',
    sections: ['separations'],
    permissions: standardPerms('separaciones', 'separaciones'),
    navItems: [
      { label: 'Separaciones', path: '/separations', icon: UserX, section: 'separations' },
    ],
  },
  {
    id: 'turnos',
    label: 'Turnos',
    description: 'Gestión de turnos y asignación de horarios',
    details: 'Configuración de tipos de turno (matutino, vespertino, nocturno, mixto), asignación de turnos a empleados con fechas de vigencia, rotación de turnos y reportes de cobertura por área.',
    icon: Clock,
    category: 'hr',
    sections: ['shifts'],
    permissions: standardPerms('turnos', 'turnos'),
    navItems: [
      { label: 'Turnos', path: '/shifts', icon: Clock, section: 'shifts' },
    ],
  },
  {
    id: 'checadas',
    label: 'Checadas',
    description: 'Registro de checadas y control biométrico',
    details: 'Registro de checadas de entrada y salida: integración con dispositivos biométricos, log de eventos IN/OUT, detección de anomalías (checada faltante, fuera de horario), y cruce automático con asistencia.',
    icon: Fingerprint,
    category: 'hr',
    sections: ['checkins'],
    permissions: standardPerms('checadas', 'checadas'),
    navItems: [
      { label: 'Checadas', path: '/checkins', icon: Fingerprint, section: 'checkins' },
    ],
  },
  {
    id: 'quejas',
    label: 'Quejas',
    description: 'Gestión de quejas y denuncias del personal',
    details: 'Sistema de quejas y denuncias laborales: levantamiento de queja con clasificación (acoso, discriminación, condiciones laborales), investigación, seguimiento de estatus, resolución y reportes de clima laboral.',
    icon: MessageSquareWarning,
    category: 'hr',
    sections: ['grievances'],
    permissions: standardPerms('quejas', 'quejas'),
    navItems: [
      { label: 'Quejas', path: '/grievances', icon: MessageSquareWarning, section: 'grievances' },
    ],
  },
  {
    id: 'habilidades',
    label: 'Habilidades',
    description: 'Mapa de habilidades y competencias del personal',
    details: 'Inventario de habilidades por empleado: registro de competencias técnicas y blandas, nivel de dominio (1-5), evaluaciones periódicas, identificación de brechas de habilidades y planes de desarrollo.',
    icon: Star,
    category: 'talent',
    sections: ['skills'],
    permissions: standardPerms('habilidades', 'habilidades'),
    navItems: [
      { label: 'Habilidades', path: '/skills', icon: Star, section: 'skills' },
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
