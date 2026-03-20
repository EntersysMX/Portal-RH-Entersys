import { isModuleEnabled } from './registry';

// ============================================
// PROFILE TAB → MODULE MAPPING
// Tabs no listados aquí son core (siempre visibles)
// ============================================

const PROFILE_TAB_MODULE: Record<string, string> = {
  prestaciones: 'prestaciones',
  nomina: 'nomina',
  asistencia: 'asistencia',
  vacaciones: 'vacaciones',
  capacitacion: 'capacitacion',
};

/** Retorna true si el tab del perfil debe mostrarse */
export function isProfileTabEnabled(tabId: string): boolean {
  const moduleId = PROFILE_TAB_MODULE[tabId];
  if (!moduleId) return true; // core tab — siempre visible
  return isModuleEnabled(moduleId);
}

// ============================================
// DASHBOARD WIDGET → MODULE MAPPING
// Widgets no listados aquí son core (siempre visibles)
// ============================================

const DASHBOARD_WIDGET_MODULE: Record<string, string> = {
  'open-positions': 'reclutamiento',
  'pending-leaves': 'vacaciones',
  'attendance-today': 'asistencia',
  'monthly-payroll': 'nomina',
  'avg-cost-employee': 'nomina',
  'turnover-rate': 'rotacion',
  'active-trainings': 'capacitacion',
  notices: 'avisos',
};

/** Retorna true si el widget del dashboard debe mostrarse */
export function isDashboardWidgetEnabled(widgetId: string): boolean {
  const moduleId = DASHBOARD_WIDGET_MODULE[widgetId];
  if (!moduleId) return true; // core widget — siempre visible
  return isModuleEnabled(moduleId);
}

// ============================================
// QUICK ACTION → MODULE MAPPING
// ============================================

const QUICK_ACTION_MODULE: Record<string, string> = {
  'nueva-vacante': 'reclutamiento',
  'registrar-asistencia': 'asistencia',
  'procesar-nomina': 'nomina',
  'descargar-nomina': 'nomina',
};

/** Retorna true si la acción rápida debe mostrarse */
export function isQuickActionEnabled(actionId: string): boolean {
  const moduleId = QUICK_ACTION_MODULE[actionId];
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}
