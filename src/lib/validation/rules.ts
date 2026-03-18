// ============================================
// REGLAS DE VALIDACIÓN CENTRALIZADAS
// ============================================

/** Puestos ejecutivos que no requieren reports_to */
export const EXECUTIVE_DESIGNATIONS = [
  'presidente',
  'ceo',
  'director general',
  'gerente general',
  'cfo',
  'cto',
  'coo',
];

export function isExecutiveDesignation(designation: string): boolean {
  return EXECUTIVE_DESIGNATIONS.includes(designation.toLowerCase().trim());
}

export interface ValidationField {
  field: string;
  label: string;
  validValues?: string[];
  format?: string;
  source?: 'catalog';
  length?: number;
  description?: string;
}

export interface ConditionalRule {
  field: string;
  description: string;
}

export interface DocTypeRules {
  required?: ValidationField[];
  formats?: ValidationField[];
  conditional?: ConditionalRule[];
  dependencies?: string[];
}

export const VALIDATION_RULES: Record<string, DocTypeRules> = {
  employee: {
    required: [
      { field: 'first_name', label: 'Nombre' },
      { field: 'last_name', label: 'Apellido Paterno' },
      { field: 'gender', label: 'Género', validValues: ['Masculino', 'Femenino', 'Otro'] },
      { field: 'date_of_birth', label: 'Fecha Nacimiento', format: 'YYYY-MM-DD' },
      { field: 'date_of_joining', label: 'Fecha Ingreso', format: 'YYYY-MM-DD' },
      { field: 'company', label: 'Empresa', source: 'catalog' },
      { field: 'department', label: 'Departamento', source: 'catalog' },
      { field: 'designation', label: 'Puesto', source: 'catalog' },
      { field: 'employment_type', label: 'Tipo Empleo', source: 'catalog' },
    ],
    formats: [
      { field: 'rfc', label: 'RFC', length: 13, description: '13 caracteres alfanuméricos' },
      { field: 'curp', label: 'CURP', length: 18, description: '18 caracteres alfanuméricos' },
      { field: 'clabe', label: 'CLABE', length: 18, description: '18 dígitos numéricos' },
      { field: 'personal_email', label: 'Email Personal', format: 'email' },
      { field: 'company_email', label: 'Email Corporativo', format: 'email' },
    ],
    conditional: [
      {
        field: 'reports_to',
        description:
          'No requerido si el puesto es Presidente, CEO, Director General, Gerente General, CFO, CTO o COO',
      },
    ],
  },
  department: {
    required: [{ field: 'department_name', label: 'Nombre del Departamento' }],
    dependencies: ['La empresa (Company) debe existir antes de crear departamentos vinculados'],
  },
  designation: {
    required: [{ field: 'designation', label: 'Nombre del Puesto' }],
  },
  company: {
    required: [
      { field: 'company_name', label: 'Nombre de la Empresa' },
      { field: 'abbr', label: 'Abreviatura' },
    ],
  },
  branch: {
    required: [{ field: 'branch', label: 'Nombre de la Sucursal' }],
  },
  employment_type: {
    required: [{ field: 'name', label: 'Tipo de Empleo' }],
  },
};
