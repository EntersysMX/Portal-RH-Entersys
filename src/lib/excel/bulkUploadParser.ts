// ============================================
// PARSER DE PLANTILLA DE CARGA MASIVA
// Lee el Excel subido y extrae datos de empleados
// ============================================

import ExcelJS from 'exceljs';

export interface ParsedEmployee {
  rowNumber: number;
  // Personal
  first_name: string;
  middle_name: string;
  last_name: string;
  last_name_2: string;
  gender: string;
  date_of_birth: string;
  // Laboral
  date_of_joining: string;
  company: string;
  department: string;
  designation: string;
  employment_type: string;
  branch: string;
  // Identificación MX
  rfc: string;
  curp: string;
  nss: string;
  // Demográfico
  marital_status: string;
  blood_group: string;
  // Contacto
  cell_phone: string;
  personal_email: string;
  company_email: string;
  current_address: string;
  linkedin_profile: string;
  // Bancario
  bank_name: string;
  bank_ac_no: string;
  clabe: string;
  // Emergencia
  emergency_contact_name: string;
  emergency_phone: string;
  relation: string;
  // Compensación
  ctc: number | null;
  salary_currency: string;
  // Organización
  reports_to: string;
}

export interface ParsedRow {
  employee: ParsedEmployee;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  fileName: string;
}

const REQUIRED_FIELDS: (keyof ParsedEmployee)[] = [
  'first_name', 'last_name', 'gender', 'date_of_birth',
  'date_of_joining', 'company', 'department', 'designation', 'employment_type',
];

const VALID_GENDERS = ['Male', 'Female', 'Other'];
const VALID_EMPLOYMENT = ['Full-time', 'Part-time', 'Contract', 'Intern', 'Commission', 'Freelance', 'Piecework'];
const VALID_MARITAL = ['Single', 'Married', 'Divorced', 'Widowed', ''];
const VALID_BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];

function cellToString(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val == null) return '';
  if (typeof val === 'object' && 'text' in val) return String(val.text).trim();
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

function cellToNumber(cell: ExcelJS.Cell): number | null {
  const val = cell.value;
  if (val == null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function isDateValid(dateStr: string): boolean {
  if (!dateStr) return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function isEmailValid(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRow(emp: ParsedEmployee): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    const val = emp[field];
    if (val == null || val === '' || val === 0) {
      const labels: Record<string, string> = {
        first_name: 'Nombre',
        last_name: 'Apellido Paterno',
        gender: 'Género',
        date_of_birth: 'Fecha Nacimiento',
        date_of_joining: 'Fecha Ingreso',
        company: 'Empresa',
        department: 'Departamento',
        designation: 'Puesto',
        employment_type: 'Tipo Empleo',
      };
      errors.push(`${labels[field] || field} es requerido`);
    }
  }

  // Validar género
  if (emp.gender && !VALID_GENDERS.includes(emp.gender)) {
    errors.push(`Género "${emp.gender}" no válido (use: ${VALID_GENDERS.join(', ')})`);
  }

  // Validar tipo empleo
  if (emp.employment_type && !VALID_EMPLOYMENT.includes(emp.employment_type)) {
    errors.push(`Tipo empleo "${emp.employment_type}" no válido`);
  }

  // Validar estado civil
  if (emp.marital_status && !VALID_MARITAL.includes(emp.marital_status)) {
    warnings.push(`Estado civil "${emp.marital_status}" no estándar`);
  }

  // Validar grupo sanguíneo
  if (emp.blood_group && !VALID_BLOOD.includes(emp.blood_group)) {
    warnings.push(`Grupo sanguíneo "${emp.blood_group}" no estándar`);
  }

  // Validar fechas
  if (emp.date_of_birth && !isDateValid(emp.date_of_birth)) {
    errors.push('Fecha nacimiento formato inválido (use AAAA-MM-DD)');
  }
  if (emp.date_of_joining && !isDateValid(emp.date_of_joining)) {
    errors.push('Fecha ingreso formato inválido (use AAAA-MM-DD)');
  }

  // Validar emails
  if (!isEmailValid(emp.personal_email)) {
    warnings.push('Email personal no tiene formato válido');
  }
  if (!isEmailValid(emp.company_email)) {
    warnings.push('Email corporativo no tiene formato válido');
  }

  // Validar RFC (13 chars para persona física)
  if (emp.rfc && emp.rfc.length !== 13) {
    warnings.push(`RFC tiene ${emp.rfc.length} caracteres (esperado: 13)`);
  }

  // Validar CURP (18 chars)
  if (emp.curp && emp.curp.length !== 18) {
    warnings.push(`CURP tiene ${emp.curp.length} caracteres (esperado: 18)`);
  }

  // Validar CLABE (18 dígitos)
  if (emp.clabe && (emp.clabe.length !== 18 || !/^\d+$/.test(emp.clabe))) {
    warnings.push('CLABE debe ser 18 dígitos numéricos');
  }

  // Validar CTC positivo
  if (emp.ctc != null && emp.ctc < 0) {
    errors.push('Salario/CTC no puede ser negativo');
  }

  return { errors, warnings };
}

export async function parseUploadedExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  // Buscar hoja "Empleados"
  const ws = wb.getWorksheet('Empleados');
  if (!ws) {
    throw new Error('No se encontró la hoja "Empleados". Asegúrese de usar la plantilla oficial de EnterHR.');
  }

  const rows: ParsedRow[] = [];

  // Los datos empiezan en fila 6 (fila 5 es encabezado)
  const DATA_START = 6;
  const lastRow = ws.rowCount;

  for (let r = DATA_START; r <= lastRow; r++) {
    const row = ws.getRow(r);

    // Verificar si la fila está vacía (al menos nombre debe tener algo)
    const firstName = cellToString(row.getCell(1));
    const lastName = cellToString(row.getCell(3));
    if (!firstName && !lastName) continue;

    const emp: ParsedEmployee = {
      rowNumber: r,
      first_name: firstName,
      middle_name: cellToString(row.getCell(2)),
      last_name: lastName,
      last_name_2: cellToString(row.getCell(4)),
      gender: cellToString(row.getCell(5)),
      date_of_birth: cellToString(row.getCell(6)),
      date_of_joining: cellToString(row.getCell(7)),
      company: cellToString(row.getCell(8)),
      department: cellToString(row.getCell(9)),
      designation: cellToString(row.getCell(10)),
      employment_type: cellToString(row.getCell(11)),
      branch: cellToString(row.getCell(12)),
      rfc: cellToString(row.getCell(13)),
      curp: cellToString(row.getCell(14)),
      nss: cellToString(row.getCell(15)),
      marital_status: cellToString(row.getCell(16)),
      blood_group: cellToString(row.getCell(17)),
      cell_phone: cellToString(row.getCell(18)),
      personal_email: cellToString(row.getCell(19)),
      company_email: cellToString(row.getCell(20)),
      current_address: cellToString(row.getCell(21)),
      linkedin_profile: cellToString(row.getCell(22)),
      bank_name: cellToString(row.getCell(23)),
      bank_ac_no: cellToString(row.getCell(24)),
      clabe: cellToString(row.getCell(25)),
      emergency_contact_name: cellToString(row.getCell(26)),
      emergency_phone: cellToString(row.getCell(27)),
      relation: cellToString(row.getCell(28)),
      ctc: cellToNumber(row.getCell(29)),
      salary_currency: cellToString(row.getCell(30)),
      reports_to: cellToString(row.getCell(31)),
    };

    const { errors, warnings } = validateRow(emp);

    rows.push({
      employee: emp,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  }

  return {
    rows,
    totalRows: rows.length,
    validRows: rows.filter((r) => r.isValid).length,
    invalidRows: rows.filter((r) => !r.isValid).length,
    fileName: file.name,
  };
}

/** Convierte ParsedEmployee a los datos que acepta employeeService.create */
export function toEmployeeCreateData(emp: ParsedEmployee): Record<string, unknown> {
  const data: Record<string, unknown> = {
    first_name: emp.first_name,
    last_name: emp.last_name,
    gender: emp.gender,
    date_of_birth: emp.date_of_birth,
    date_of_joining: emp.date_of_joining,
    company: emp.company,
    department: emp.department,
    designation: emp.designation,
    employment_type: emp.employment_type,
  };

  // Construir employee_name
  const parts = [emp.first_name, emp.middle_name, emp.last_name, emp.last_name_2].filter(Boolean);
  data.employee_name = parts.join(' ');

  // Campos opcionales (solo si tienen valor)
  if (emp.middle_name) data.middle_name = emp.middle_name;
  if (emp.branch) data.branch = emp.branch;
  if (emp.rfc) data.rfc = emp.rfc;
  if (emp.curp) data.curp = emp.curp;
  if (emp.nss) data.nss = emp.nss;
  if (emp.marital_status) data.marital_status = emp.marital_status;
  if (emp.blood_group) data.blood_group = emp.blood_group;
  if (emp.cell_phone) data.cell_phone = emp.cell_phone;
  if (emp.personal_email) data.personal_email = emp.personal_email;
  if (emp.company_email) data.company_email = emp.company_email;
  if (emp.current_address) data.current_address = emp.current_address;
  if (emp.linkedin_profile) data.linkedin_profile = emp.linkedin_profile;
  if (emp.bank_name) data.bank_name = emp.bank_name;
  if (emp.bank_ac_no) data.bank_ac_no = emp.bank_ac_no;
  if (emp.clabe) data.clabe = emp.clabe;
  if (emp.emergency_contact_name) data.emergency_contact_name = emp.emergency_contact_name;
  if (emp.emergency_phone) data.emergency_phone = emp.emergency_phone;
  if (emp.relation) data.relation = emp.relation;
  if (emp.ctc != null) data.ctc = emp.ctc;
  if (emp.salary_currency) data.salary_currency = emp.salary_currency;
  if (emp.reports_to) data.reports_to = emp.reports_to;

  return data;
}
