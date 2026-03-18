// ============================================
// CATÁLOGOS EN ESPAÑOL PARA ENTERHR
//
// Género y Tipo de Empleo: se crean directamente
// en Frappe DB (son Link fields a DocTypes).
//
// Estado Civil: Frappe usa Select con valores en
// inglés, mapeamos español → inglés al crear empleados.
// ============================================

import { catalogService } from '@/api/services';

// ============================================
// GÉNERO — se crea en DocType "Gender"
// ============================================
export const SPANISH_GENDERS = ['Masculino', 'Femenino', 'Otro'] as const;

// ============================================
// TIPO DE EMPLEO — se crea en DocType "Employment Type"
// ============================================
export const SPANISH_EMPLOYMENT_TYPES = [
  'Tiempo Completo',
  'Medio Tiempo',
  'Contrato',
  'Becario',
  'Comisión',
  'Freelance',
  'Por Obra',
] as const;

// ============================================
// ESTADO CIVIL — Select en Frappe, mapeo bidireccional
// ============================================
export const SPANISH_MARITAL_STATUS = [
  'Soltero(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viudo(a)',
] as const;

export const MARITAL_TO_FRAPPE: Record<string, string> = {
  'Soltero(a)': 'Single',
  'Casado(a)': 'Married',
  'Divorciado(a)': 'Divorced',
  'Viudo(a)': 'Widowed',
};

// ============================================
// GRUPO SANGUÍNEO — universal, sin traducción
// ============================================
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

// ============================================
// BANCOS — ya en español
// ============================================
export const BANKS = [
  'BBVA', 'Santander', 'Banorte', 'HSBC', 'Scotiabank',
  'Citibanamex', 'Banco Azteca', 'Inbursa', 'BanCoppel',
  'Banregio', 'Afirme', 'Otro',
] as const;

// ============================================
// PARENTESCO — ya en español
// ============================================
export const RELATIONSHIPS = ['Padre', 'Madre', 'Esposo(a)', 'Hermano(a)', 'Hijo(a)', 'Otro'] as const;

// ============================================
// MONEDA — universal
// ============================================
export const CURRENCIES = ['MXN', 'USD'] as const;

// ============================================
// INTERFACE PARA CATÁLOGOS DINÁMICOS (de BD)
// ============================================
export interface DynamicCatalogs {
  companies: string[];
  departments: string[];
  designations: string[];
  branches: string[];
  employmentTypes: string[];
  employees: { id: string; name: string }[];
}

// ============================================
// CREAR CATÁLOGOS EN ESPAÑOL EN FRAPPE DB
// Se llama antes de generar la plantilla Excel.
// ensureExists ignora si ya existen (DuplicateEntryError).
// ============================================
export async function ensureSpanishCatalogs(): Promise<void> {
  const promises: Promise<void>[] = [];

  // Crear géneros en español en DocType "Gender"
  for (const g of SPANISH_GENDERS) {
    promises.push(catalogService.ensureExists('Gender', { gender: g }));
  }

  // Crear tipos de empleo en español en DocType "Employment Type"
  for (const et of SPANISH_EMPLOYMENT_TYPES) {
    promises.push(catalogService.ensureExists('Employment Type', { employee_type_name: et }));
  }

  await Promise.all(promises);
}
