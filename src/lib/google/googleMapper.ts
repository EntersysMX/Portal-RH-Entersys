// ============================================
// COLUMN MAPPING & EMPLOYEE MERGE LOGIC
// ============================================

import type { Employee } from '@/types/frappe';
import type { ColumnMapping, MergedEmployee } from './types';
import { REQUIRED_EMPLOYEE_FIELDS } from './types';

/**
 * Diccionario de sinonimos para auto-mapeo de columnas.
 * Cada campo de Employee tiene una lista de palabras clave que lo identifican.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  first_name: ['nombre', 'name', 'first', 'first_name', 'primer nombre', 'nombres'],
  middle_name: ['segundo nombre', 'middle', 'middle_name'],
  last_name: ['apellido', 'apellido paterno', 'last', 'last_name', 'paterno', 'surname'],
  last_name_2: ['apellido materno', 'materno', 'last_name_2', 'segundo apellido'],
  gender: ['genero', 'gender', 'sexo', 'sex'],
  date_of_birth: ['nacimiento', 'birthday', 'birth', 'fecha nacimiento', 'fecha_nacimiento', 'date_of_birth', 'cumpleanos', 'fdn'],
  date_of_joining: ['ingreso', 'hiring', 'joined', 'fecha ingreso', 'fecha_ingreso', 'date_of_joining', 'alta', 'inicio'],
  company: ['empresa', 'company', 'compania', 'razon social'],
  department: ['departamento', 'dept', 'area', 'department', 'depto'],
  designation: ['puesto', 'titulo', 'position', 'job', 'designation', 'cargo', 'rol', 'job title'],
  employment_type: ['tipo empleo', 'tipo de empleo', 'employment_type', 'contrato', 'tipo contrato'],
  branch: ['sucursal', 'branch', 'oficina', 'sede', 'location', 'ubicacion'],
  cell_phone: ['telefono', 'phone', 'cel', 'celular', 'cell_phone', 'movil', 'tel', 'mobile'],
  personal_email: ['email personal', 'personal_email', 'correo personal'],
  company_email: ['email', 'correo', 'company_email', 'email corporativo', 'correo corporativo', 'mail'],
  rfc: ['rfc'],
  curp: ['curp'],
  nss: ['nss', 'imss', 'seguro social', 'numero seguro'],
  marital_status: ['estado civil', 'marital', 'marital_status', 'civil'],
  blood_group: ['tipo sangre', 'blood', 'blood_group', 'sangre', 'grupo sanguineo'],
  bank_name: ['banco', 'bank', 'bank_name', 'nombre banco'],
  bank_ac_no: ['cuenta', 'account', 'bank_ac_no', 'cuenta bancaria', 'no cuenta', 'numero cuenta'],
  clabe: ['clabe', 'clabe interbancaria'],
  current_address: ['direccion', 'address', 'domicilio', 'current_address'],
  emergency_contact_name: ['contacto emergencia', 'emergency', 'emergencia nombre'],
  emergency_phone: ['tel emergencia', 'emergency phone', 'telefono emergencia'],
  relation: ['parentesco', 'relacion', 'relation'],
  reports_to: ['reporta a', 'reports_to', 'jefe', 'supervisor', 'manager'],
  linkedin_profile: ['linkedin', 'linkedin_profile'],
};

/**
 * Normaliza un string para comparacion (minusculas, sin acentos, sin espacios extras).
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-\/\\]/g, ' ')
    .trim();
}

/**
 * Auto-mapea columnas de una hoja a campos de Employee.
 * Retorna un ColumnMapping[] con confidence score.
 */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const norm = normalize(header);

    let bestField = '';
    let bestScore = 0;

    for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
      for (const synonym of synonyms) {
        const normSyn = normalize(synonym);

        // Coincidencia exacta
        if (norm === normSyn) {
          bestField = field;
          bestScore = 1;
          break;
        }

        // Header contiene el sinonimo
        if (norm.includes(normSyn) && normSyn.length >= 3) {
          const score = normSyn.length / norm.length;
          if (score > bestScore) {
            bestField = field;
            bestScore = Math.min(score + 0.3, 0.95);
          }
        }

        // Sinonimo contiene el header
        if (normSyn.includes(norm) && norm.length >= 3) {
          const score = norm.length / normSyn.length;
          if (score > bestScore) {
            bestField = field;
            bestScore = Math.min(score + 0.2, 0.9);
          }
        }
      }

      if (bestScore === 1) break;
    }

    return {
      sheetColumn: header,
      employeeField: bestScore >= 0.4 ? bestField : '',
      confidence: bestScore,
    };
  });
}

/**
 * Aplica mappings a las filas de un sheet.
 * Retorna array de Partial<Employee>.
 */
export function applyMapping(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Partial<Employee>[] {
  const activeMappings = mappings.filter((m) => m.employeeField);

  return rows.map((row) => {
    const emp: Record<string, string> = {};
    for (const mapping of activeMappings) {
      const value = row[mapping.sheetColumn];
      if (value) {
        emp[mapping.employeeField] = value;
      }
    }
    return emp as Partial<Employee>;
  });
}

/**
 * Merge de empleados del directorio y de hojas de sheets.
 * Usa company_email como llave principal.
 *
 * Prioridad: directorio para nombre/depto; sheet para datos extras (RFC, CURP, banco, etc.)
 */
export function mergeEmployees(
  directoryEmployees: Partial<Employee>[],
  sheetEmployees: Partial<Employee>[]
): MergedEmployee[] {
  const mergedMap = new Map<string, MergedEmployee>();

  // 1. Agregar todos del directorio
  for (const emp of directoryEmployees) {
    const email = (emp.company_email || emp.personal_email || '').toLowerCase();
    if (!email) continue;

    mergedMap.set(email, {
      email,
      source: ['directory'],
      data: { ...emp },
      conflicts: [],
      isValid: false,
      errors: [],
      warnings: [],
    });
  }

  // 2. Merge con empleados de sheets
  for (const emp of sheetEmployees) {
    const email = (emp.company_email || emp.personal_email || '').toLowerCase();
    if (!email) continue;

    const existing = mergedMap.get(email);
    if (existing) {
      // Merge: directorio tiene prioridad para nombre/depto, sheet para extras
      const directoryPriorityFields = ['first_name', 'last_name', 'department', 'designation', 'company_email'];
      const conflicts: MergedEmployee['conflicts'] = [];

      for (const [key, sheetValue] of Object.entries(emp)) {
        if (!sheetValue) continue;
        const dirValue = existing.data[key as keyof Employee];

        if (dirValue && String(dirValue) !== String(sheetValue)) {
          if (directoryPriorityFields.includes(key)) {
            conflicts.push({
              field: key,
              directoryValue: String(dirValue),
              sheetValue: String(sheetValue),
            });
          } else {
            // Sheet tiene prioridad para campos extras
            (existing.data as Record<string, unknown>)[key] = sheetValue;
            conflicts.push({
              field: key,
              directoryValue: String(dirValue),
              sheetValue: String(sheetValue),
            });
          }
        } else if (!dirValue) {
          (existing.data as Record<string, unknown>)[key] = sheetValue;
        }
      }

      existing.source = ['directory', 'sheet'];
      existing.conflicts = conflicts;
    } else {
      mergedMap.set(email, {
        email,
        source: ['sheet'],
        data: { ...emp },
        conflicts: [],
        isValid: false,
        errors: [],
        warnings: [],
      });
    }
  }

  // 3. Validar todos
  const result = Array.from(mergedMap.values());
  result.forEach(validateMergedEmployee);

  return result;
}

/**
 * Valida un empleado consolidado.
 * Marca errores (campos requeridos faltantes) y warnings.
 */
export function validateMergedEmployee(emp: MergedEmployee): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const d = emp.data;

  // Campos requeridos
  for (const field of REQUIRED_EMPLOYEE_FIELDS) {
    const val = d[field as keyof Employee];
    if (!val || (typeof val === 'string' && val.trim() === '')) {
      const labels: Record<string, string> = {
        first_name: 'Nombre',
        last_name: 'Apellido',
        gender: 'Genero',
        date_of_birth: 'Fecha de nacimiento',
        date_of_joining: 'Fecha de ingreso',
        company: 'Empresa',
        department: 'Departamento',
        designation: 'Puesto',
        employment_type: 'Tipo de empleo',
      };
      errors.push(`Falta: ${labels[field] || field}`);
    }
  }

  // Validacion de genero (acepta español y inglés)
  const validGenders = ['Masculino', 'Femenino', 'Otro', 'Male', 'Female', 'Other'];
  if (d.gender && !validGenders.includes(d.gender)) {
    warnings.push(`Genero "${d.gender}" no estandar (se espera Masculino/Femenino/Otro)`);
  }

  // Validacion de tipo de empleo (acepta español y inglés)
  const validTypes = [
    'Tiempo Completo', 'Medio Tiempo', 'Contrato', 'Becario', 'Comisión', 'Freelance', 'Por Obra',
    'Full-time', 'Part-time', 'Contract', 'Intern', 'Probation',
  ];
  if (d.employment_type && !validTypes.includes(d.employment_type)) {
    warnings.push(`Tipo de empleo "${d.employment_type}" no estandar`);
  }

  // Validacion de fechas
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (d.date_of_birth && !dateRegex.test(d.date_of_birth)) {
    warnings.push('Fecha de nacimiento no tiene formato YYYY-MM-DD');
  }
  if (d.date_of_joining && !dateRegex.test(d.date_of_joining)) {
    warnings.push('Fecha de ingreso no tiene formato YYYY-MM-DD');
  }

  // Validaciones de formato (warnings)
  if (d.rfc && d.rfc.length !== 13) {
    warnings.push(`RFC tiene ${d.rfc.length} caracteres (se esperan 13)`);
  }
  if (d.curp && d.curp.length !== 18) {
    warnings.push(`CURP tiene ${d.curp.length} caracteres (se esperan 18)`);
  }
  if (d.clabe && (d.clabe.length !== 18 || !/^\d+$/.test(d.clabe))) {
    warnings.push('CLABE debe tener 18 digitos numericos');
  }
  if (d.personal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.personal_email)) {
    warnings.push('Email personal tiene formato invalido');
  }

  // Conflictos
  if (emp.conflicts.length > 0) {
    warnings.push(`${emp.conflicts.length} campo(s) con valores diferentes entre fuentes`);
  }

  emp.errors = errors;
  emp.warnings = warnings;
  emp.isValid = errors.length === 0;
}
