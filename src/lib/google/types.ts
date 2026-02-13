import type { Employee } from '@/types/frappe';

// ============================================
// GOOGLE WORKSPACE INTEGRATION TYPES
// ============================================

/** Configuracion guardada en localStorage */
export interface GoogleConfig {
  clientId: string;
  domain: string;          // ej. "entersys.com"
  defaultCompany: string;  // ej. "Entersys"
}

/** Usuario del Google Workspace Directory API */
export interface GoogleDirectoryUser {
  primaryEmail: string;
  name: { givenName: string; familyName: string; fullName: string };
  phones?: { value: string; type: string }[];
  organizations?: { title: string; department: string }[];
  thumbnailPhotoUrl?: string;
  suspended: boolean;
}

/** Respuesta paginada del Directory API */
export interface DirectoryListResponse {
  users?: GoogleDirectoryUser[];
  nextPageToken?: string;
}

/** Hoja de Google Sheets detectada */
export interface GoogleSheet {
  spreadsheetId: string;
  title: string;          // nombre del spreadsheet
  sheets: SheetInfo[];
}

export interface SheetInfo {
  sheetId: number;
  title: string;
  rowCount: number;
}

/** Mapeo de una columna del sheet a un campo de Employee */
export interface ColumnMapping {
  sheetColumn: string;    // nombre del header en la hoja
  employeeField: string;  // campo de Employee (first_name, etc.) o '' si no mapea
  confidence: number;     // 0-1 de auto-match
}

/** Datos de una hoja seleccionada con su mapeo */
export interface SheetWithMapping {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetTitle: string;
  headers: string[];
  rows: Record<string, string>[];
  mappings: ColumnMapping[];
}

/** Empleado consolidado de multiples fuentes */
export interface MergedEmployee {
  email: string;          // llave de merge
  source: ('directory' | 'sheet')[];
  data: Partial<Employee>;
  conflicts: EmployeeConflict[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EmployeeConflict {
  field: string;
  directoryValue: string;
  sheetValue: string;
}

/** Estado del wizard */
export type SyncStep = 'config' | 'auth' | 'directory' | 'sheets' | 'mapping' | 'preview' | 'importing' | 'done';

/** Resultado de importacion */
export interface ImportResult {
  email: string;
  name: string;
  success: boolean;
  error?: string;
}

/** Campos mapeables del Employee */
export const MAPPABLE_FIELDS: { value: string; label: string }[] = [
  { value: '', label: '-- No mapear --' },
  { value: 'first_name', label: 'Nombre' },
  { value: 'middle_name', label: 'Segundo nombre' },
  { value: 'last_name', label: 'Apellido paterno' },
  { value: 'last_name_2', label: 'Apellido materno' },
  { value: 'gender', label: 'Genero' },
  { value: 'date_of_birth', label: 'Fecha de nacimiento' },
  { value: 'date_of_joining', label: 'Fecha de ingreso' },
  { value: 'company', label: 'Empresa' },
  { value: 'department', label: 'Departamento' },
  { value: 'designation', label: 'Puesto' },
  { value: 'employment_type', label: 'Tipo de empleo' },
  { value: 'branch', label: 'Sucursal' },
  { value: 'cell_phone', label: 'Celular' },
  { value: 'personal_email', label: 'Email personal' },
  { value: 'company_email', label: 'Email corporativo' },
  { value: 'rfc', label: 'RFC' },
  { value: 'curp', label: 'CURP' },
  { value: 'nss', label: 'NSS / IMSS' },
  { value: 'marital_status', label: 'Estado civil' },
  { value: 'blood_group', label: 'Tipo de sangre' },
  { value: 'bank_name', label: 'Banco' },
  { value: 'bank_ac_no', label: 'Cuenta bancaria' },
  { value: 'clabe', label: 'CLABE' },
  { value: 'current_address', label: 'Direccion actual' },
  { value: 'emergency_contact_name', label: 'Contacto de emergencia' },
  { value: 'emergency_phone', label: 'Tel. emergencia' },
  { value: 'relation', label: 'Parentesco emergencia' },
  { value: 'reports_to', label: 'Reporta a' },
  { value: 'linkedin_profile', label: 'LinkedIn' },
];

/** Campos requeridos para crear un Employee */
export const REQUIRED_EMPLOYEE_FIELDS = [
  'first_name', 'last_name', 'gender', 'date_of_birth',
  'date_of_joining', 'company', 'department', 'designation', 'employment_type',
] as const;
