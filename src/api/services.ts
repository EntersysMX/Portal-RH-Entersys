import {
  frappeGetList,
  frappeGetDoc,
  frappeCreateDoc,
  frappeUpdateDoc,
  frappeDeleteDoc,
  frappeGetCount,
  frappeCall,
  frappeUploadFile,
} from './client';
import type {
  Employee,
  Department,
  Designation,
  Company,
  Branch,
  EmploymentType,
  LeaveApplication,
  Attendance,
  JobOpening,
  JobApplicant,
  Appraisal,
  SalarySlip,
  PayrollEntry,
  ExpenseClaim,
  TrainingEvent,
  DashboardStats,
  EmployeeBankAccount,
  EmploymentContract,
  EmployeeBenefit,
  EmployeeFullProfile,
  FrappeFile,
  Notice,
} from '@/types/frappe';

// ============================================
// EMPLOYEE SERVICE
// ============================================
export const employeeService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number; offset?: number }) =>
    frappeGetList<Employee>({
      doctype: 'Employee',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      limit_start: params?.offset || 0,
      order_by: 'employee_name asc',
    }),

  get: (name: string) => frappeGetDoc<Employee>('Employee', name),

  create: (data: Partial<Employee>) => frappeCreateDoc<Employee>('Employee', data),

  update: (name: string, data: Partial<Employee>) =>
    frappeUpdateDoc<Employee>('Employee', name, data),

  delete: (name: string) => frappeDeleteDoc('Employee', name),

  count: (filters?: Record<string, unknown>) =>
    frappeGetCount({ doctype: 'Employee', filters }),

  updateStatus: (name: string, status: Employee['status']) =>
    frappeUpdateDoc<Employee>('Employee', name, { status }),

  getByDepartment: (department: string) =>
    frappeGetList<Employee>({
      doctype: 'Employee',
      fields: ['*'],
      filters: { department, status: 'Active' },
      limit_page_length: 100,
    }),
};

// ============================================
// DEPARTMENT SERVICE
// ============================================
export const departmentService = {
  list: () =>
    frappeGetList<Department>({
      doctype: 'Department',
      fields: ['*'],
      limit_page_length: 100,
    }),

  get: (name: string) => frappeGetDoc<Department>('Department', name),

  create: (data: Partial<Department>) => frappeCreateDoc<Department>('Department', data),

  update: (name: string, data: Partial<Department>) =>
    frappeUpdateDoc<Department>('Department', name, data),

  delete: (name: string) => frappeDeleteDoc('Department', name),
};

// ============================================
// DESIGNATION SERVICE
// ============================================
export const designationService = {
  list: () =>
    frappeGetList<Designation>({
      doctype: 'Designation',
      fields: ['*'],
      limit_page_length: 100,
    }),

  create: (data: Partial<Designation>) =>
    frappeCreateDoc<Designation>('Designation', data),

  update: (name: string, data: Partial<Designation>) =>
    frappeUpdateDoc<Designation>('Designation', name, data),

  delete: (name: string) => frappeDeleteDoc('Designation', name),
};

// ============================================
// COMPANY SERVICE
// ============================================
export const companyService = {
  list: () =>
    frappeGetList<Company>({
      doctype: 'Company',
      fields: ['*'],
      limit_page_length: 100,
    }),

  create: (data: Partial<Company>) =>
    frappeCreateDoc<Company>('Company', data),

  update: (name: string, data: Partial<Company>) =>
    frappeUpdateDoc<Company>('Company', name, data),

  delete: (name: string) => frappeDeleteDoc('Company', name),
};

// ============================================
// BRANCH SERVICE
// ============================================
export const branchService = {
  list: () =>
    frappeGetList<Branch>({
      doctype: 'Branch',
      fields: ['*'],
      limit_page_length: 100,
    }),

  create: (data: Partial<Branch>) =>
    frappeCreateDoc<Branch>('Branch', data),

  update: (name: string, data: Partial<Branch>) =>
    frappeUpdateDoc<Branch>('Branch', name, data),

  delete: (name: string) => frappeDeleteDoc('Branch', name),
};

// ============================================
// EMPLOYMENT TYPE SERVICE
// ============================================
export const employmentTypeService = {
  list: () =>
    frappeGetList<EmploymentType>({
      doctype: 'Employment Type',
      fields: ['*'],
      limit_page_length: 100,
    }),

  create: (data: Partial<EmploymentType>) =>
    frappeCreateDoc<EmploymentType>('Employment Type', data),

  update: (name: string, data: Partial<EmploymentType>) =>
    frappeUpdateDoc<EmploymentType>('Employment Type', name, data),

  delete: (name: string) => frappeDeleteDoc('Employment Type', name),
};

// ============================================
// GENDER SERVICE
// ============================================
export const genderService = {
  list: () =>
    frappeGetList<{ name: string }>({
      doctype: 'Gender',
      fields: ['name'],
      limit_page_length: 100,
    }),
};

// ============================================
// CATALOG SERVICE - Ensure catalog entries exist
// ============================================
export const catalogService = {
  ensureExists: async (doctype: string, data: Record<string, unknown>): Promise<void> => {
    try {
      await frappeCreateDoc(doctype, data);
    } catch (err: unknown) {
      // Check exc_type from Frappe response first (most reliable)
      const axiosErr = err as { response?: { data?: { exc_type?: string } } };
      const excType = axiosErr?.response?.data?.exc_type || '';
      const msg = err instanceof Error ? err.message : String(err);
      if (
        excType === 'DuplicateEntryError' ||
        msg.includes('DuplicateEntryError') ||
        msg.includes('already exists') ||
        msg.includes('Duplicate')
      ) {
        return;
      }
      throw err;
    }
  },
};

// ============================================
// LEAVE SERVICE
// ============================================
export const leaveService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number; offset?: number }) =>
    frappeGetList<LeaveApplication>({
      doctype: 'Leave Application',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      limit_start: params?.offset || 0,
      order_by: 'posting_date desc',
    }),

  get: (name: string) => frappeGetDoc<LeaveApplication>('Leave Application', name),

  create: (data: Partial<LeaveApplication>) =>
    frappeCreateDoc<LeaveApplication>('Leave Application', data),

  approve: (name: string) =>
    frappeCall('frappe.client.submit', { doc: { doctype: 'Leave Application', name } }),

  reject: (name: string) =>
    frappeUpdateDoc('Leave Application', name, { status: 'Rejected' }),

  pendingCount: () =>
    frappeGetCount({ doctype: 'Leave Application', filters: { status: 'Open' } }),
};

// ============================================
// ATTENDANCE SERVICE
// ============================================
export const attendanceService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number; offset?: number }) =>
    frappeGetList<Attendance>({
      doctype: 'Attendance',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      limit_start: params?.offset || 0,
      order_by: 'attendance_date desc',
    }),

  markAttendance: (data: Partial<Attendance>) =>
    frappeCreateDoc<Attendance>('Attendance', data),

  todayCount: (date: string) =>
    frappeGetCount({
      doctype: 'Attendance',
      filters: { attendance_date: date, status: 'Present' },
    }),
};

// ============================================
// RECRUITMENT SERVICE (Job Openings + Applicants)
// ============================================
export const recruitmentService = {
  // Job Openings
  listOpenings: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<JobOpening>({
      doctype: 'Job Opening',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'creation desc',
    }),

  getOpening: (name: string) => frappeGetDoc<JobOpening>('Job Opening', name),

  createOpening: (data: Partial<JobOpening>) =>
    frappeCreateDoc<JobOpening>('Job Opening', data),

  updateOpening: (name: string, data: Partial<JobOpening>) =>
    frappeUpdateDoc<JobOpening>('Job Opening', name, data),

  openPositionsCount: () =>
    frappeGetCount({ doctype: 'Job Opening', filters: { status: 'Open' } }),

  // Job Applicants
  listApplicants: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<JobApplicant>({
      doctype: 'Job Applicant',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'creation desc',
    }),

  getApplicant: (name: string) => frappeGetDoc<JobApplicant>('Job Applicant', name),

  createApplicant: (data: Partial<JobApplicant>) =>
    frappeCreateDoc<JobApplicant>('Job Applicant', data),

  updateApplicantStatus: (name: string, status: JobApplicant['status']) =>
    frappeUpdateDoc<JobApplicant>('Job Applicant', name, { status }),
};

// ============================================
// PERFORMANCE SERVICE (Appraisals)
// ============================================
export const performanceService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<Appraisal>({
      doctype: 'Appraisal',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'creation desc',
    }),

  get: (name: string) => frappeGetDoc<Appraisal>('Appraisal', name),

  create: (data: Partial<Appraisal>) => frappeCreateDoc<Appraisal>('Appraisal', data),

  update: (name: string, data: Partial<Appraisal>) =>
    frappeUpdateDoc<Appraisal>('Appraisal', name, data),
};

// ============================================
// PAYROLL SERVICE
// ============================================
export const payrollService = {
  listSlips: (params?: { filters?: Record<string, unknown>; limit?: number; offset?: number }) =>
    frappeGetList<SalarySlip>({
      doctype: 'Salary Slip',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      limit_start: params?.offset || 0,
      order_by: 'posting_date desc',
    }),

  getSlip: (name: string) => frappeGetDoc<SalarySlip>('Salary Slip', name),

  listPayrollEntries: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<PayrollEntry>({
      doctype: 'Payroll Entry',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'posting_date desc',
    }),
};

// ============================================
// EXPENSE SERVICE
// ============================================
export const expenseService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<ExpenseClaim>({
      doctype: 'Expense Claim',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'creation desc',
    }),

  get: (name: string) => frappeGetDoc<ExpenseClaim>('Expense Claim', name),

  create: (data: Partial<ExpenseClaim>) =>
    frappeCreateDoc<ExpenseClaim>('Expense Claim', data),
};

// ============================================
// TRAINING SERVICE
// ============================================
export const trainingService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<TrainingEvent>({
      doctype: 'Training Event',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 20,
      order_by: 'start_time desc',
    }),

  get: (name: string) => frappeGetDoc<TrainingEvent>('Training Event', name),

  create: (data: Partial<TrainingEvent>) =>
    frappeCreateDoc<TrainingEvent>('Training Event', data),
};

// ============================================
// DASHBOARD SERVICE - Aggregated stats
// ============================================
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.substring(0, 7)}-01`;

    const [
      totalEmployees,
      activeEmployees,
      newHires,
      openPositions,
      pendingLeaves,
      attendanceToday,
      departments,
    ] = await Promise.all([
      frappeGetCount({ doctype: 'Employee' }),
      frappeGetCount({ doctype: 'Employee', filters: { status: 'Active' } }),
      frappeGetCount({
        doctype: 'Employee',
        filters: [['date_of_joining', '>=', monthStart]],
      }),
      frappeGetCount({ doctype: 'Job Opening', filters: { status: 'Open' } }),
      frappeGetCount({ doctype: 'Leave Application', filters: { status: 'Open' } }),
      frappeGetCount({
        doctype: 'Attendance',
        filters: { attendance_date: today, status: 'Present' },
      }),
      frappeGetList<{ department: string; count: number }>({
        doctype: 'Employee',
        fields: ['department', 'count(name) as count'],
        filters: { status: 'Active' },
        group_by: 'department',
        limit_page_length: 50,
      }),
    ]);

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      new_hires_this_month: newHires,
      open_positions: openPositions,
      pending_leaves: pendingLeaves,
      attendance_today: attendanceToday,
      upcoming_birthdays: [],
      department_distribution: departments,
      monthly_hiring: [],
      leave_balance_summary: [],
      monthly_payroll_cost: 2850000,
      avg_cost_per_employee: 19000,
      turnover_rate: 2.1,
      active_trainings: 3,
    };
  },
};

// ============================================
// BANK ACCOUNT SERVICE
// ============================================
export const bankAccountService = {
  listByEmployee: (employeeId: string) =>
    frappeGetList<EmployeeBankAccount>({
      doctype: 'Employee Bank Account',
      fields: ['*'],
      filters: { employee: employeeId },
      limit_page_length: 20,
    }),

  create: (data: Partial<EmployeeBankAccount>) =>
    frappeCreateDoc<EmployeeBankAccount>('Employee Bank Account', data),

  update: (name: string, data: Partial<EmployeeBankAccount>) =>
    frappeUpdateDoc<EmployeeBankAccount>('Employee Bank Account', name, data),

  delete: (name: string) => frappeDeleteDoc('Employee Bank Account', name),
};

// ============================================
// CONTRACT SERVICE
// ============================================
export const contractService = {
  listByEmployee: (employeeId: string) =>
    frappeGetList<EmploymentContract>({
      doctype: 'Employment Contract',
      fields: ['*'],
      filters: { employee: employeeId },
      limit_page_length: 20,
      order_by: 'start_date desc',
    }),

  get: (name: string) => frappeGetDoc<EmploymentContract>('Employment Contract', name),

  create: (data: Partial<EmploymentContract>) =>
    frappeCreateDoc<EmploymentContract>('Employment Contract', data),
};

// ============================================
// BENEFIT SERVICE
// ============================================
export const benefitService = {
  listByEmployee: (employeeId: string) =>
    frappeGetList<EmployeeBenefit>({
      doctype: 'Employee Benefit',
      fields: ['*'],
      filters: { employee: employeeId },
      limit_page_length: 20,
    }),

  create: (data: Partial<EmployeeBenefit>) =>
    frappeCreateDoc<EmployeeBenefit>('Employee Benefit', data),
};

// ============================================
// NOTICE SERVICE
// ============================================
export const noticeService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) => {
    return frappeGetList<Notice>({
      doctype: 'Notice',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'posted_date desc',
    });
  },

  create: (data: Partial<Notice>) =>
    frappeCreateDoc<Notice>('Notice', data),

  update: (name: string, data: Partial<Notice>) =>
    frappeUpdateDoc<Notice>('Notice', name, data),

  delete: (name: string) => frappeDeleteDoc('Notice', name),
};

// ============================================
// EMPLOYEE DOCUMENT SERVICE (File-based)
// ============================================
export const employeeDocumentService = {
  listByEmployee: (employeeId: string) =>
    frappeGetList<FrappeFile>({
      doctype: 'File',
      fields: ['name', 'file_name', 'file_url', 'file_size', 'is_private', 'creation', 'owner'],
      filters: {
        attached_to_doctype: 'Employee',
        attached_to_name: employeeId,
      },
      order_by: 'creation desc',
      limit_page_length: 50,
    }),

  upload: (employeeId: string, file: File) =>
    frappeUploadFile({
      file,
      doctype: 'Employee',
      docname: employeeId,
      is_private: true,
    }),

  delete: (name: string) =>
    frappeDeleteDoc('File', name),
};

// ============================================
// EMPLOYEE FULL PROFILE SERVICE
// ============================================
export const employeeProfileService = {
  getFullProfile: async (employeeId: string): Promise<EmployeeFullProfile> => {
    const [
      employee,
      bank_accounts,
      contracts,
      benefits,
      salary_slips,
      leaves,
      trainings,
    ] = await Promise.all([
      employeeService.get(employeeId),
      bankAccountService.listByEmployee(employeeId).catch(() => []),
      contractService.listByEmployee(employeeId).catch(() => []),
      benefitService.listByEmployee(employeeId).catch(() => []),
      payrollService.listSlips({ filters: { employee: employeeId }, limit: 12 }).catch(() => []),
      leaveService.list({ filters: { employee: employeeId }, limit: 20 }).catch(() => []),
      trainingService.list({ limit: 10 }).catch(() => []),
    ]);

    return {
      employee,
      bank_accounts,
      contracts,
      benefits,
      emergency_contacts: [],
      documents: [],
      activities: [],
      salary_slips,
      leaves,
      attendance_summary: { present: 0, absent: 0, leave: 0, wfh: 0, total: 0 },
      training_events: trainings.filter((t) =>
        t.employees?.some((e) => e.employee === employeeId)
      ),
      vacation_balance: 0,
    };
  },
};

// ============================================
// PAYROLL SERVICE EXTENDED
// ============================================
export const payrollServiceExtended = {
  listSlipsWithDemo: (params?: { filters?: Record<string, unknown>; limit?: number; offset?: number }) => {
    return payrollService.listSlips(params);
  },
};

// ============================================
// PLATFORM CONFIG SERVICE
// Persiste configuración de módulos, roles y
// asignaciones en la BD de Frappe usando
// frappe.client.get_default / set_default
// con localStorage como caché de respaldo.
//
// SEGURIDAD:
//   - loadConfig: TODOS los usuarios autenticados pueden leer.
//     Frappe get_default es global (__default), accesible a cualquier usuario.
//     Si Frappe lo bloquea para roles bajos, se usa el caché local.
//   - saveConfig: SOLO admin (System Manager) puede escribir.
//     Frappe set_default requiere System Manager; además el frontend
//     solo expone las acciones de escritura en páginas admin-*.
//
// CACHÉ LOCAL:
//   Después de cada lectura exitosa del backend se guarda en localStorage
//   para que:
//   1. Recarga de página sea instantánea (sin esperar al backend)
//   2. Si el backend falla temporalmente, el usuario ve la última config conocida
//
// TIMEOUT:
//   Cada llamada al backend tiene un timeout de 8s para evitar spinners infinitos.
// ============================================
const CACHE_PREFIX = 'enterhr_cache_';
const CONFIG_TIMEOUT_MS = 8_000;

/** Wrapper que agrega timeout a una promesa */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Config load timeout')), ms)
    ),
  ]);
}

async function loadConfig<T>(key: string, fallback: T): Promise<T> {
  // 1. Intentar caché local primero (respuesta instantánea)
  let cached: T | null = null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) cached = JSON.parse(raw) as T;
  } catch { /* ignore corrupt cache */ }

  // 2. Intentar backend (con timeout) para obtener la versión más reciente
  try {
    const raw = await withTimeout(
      frappeCall<string | null>('frappe.client.get_default', { key }),
      CONFIG_TIMEOUT_MS,
    );
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      localStorage.setItem(CACHE_PREFIX + key, raw);
      return parsed;
    }
  } catch {
    // Backend no disponible o timeout → usar caché si existe
    if (cached !== null) return cached;
  }

  // 3. Si el backend retornó null (no hay config guardada aún), usar caché o fallback
  return cached ?? fallback;
}

async function saveConfig<T>(key: string, data: T): Promise<void> {
  const json = JSON.stringify(data);
  // Guardar en backend (requiere System Manager)
  await frappeCall('frappe.client.set_default', { key, value: json });
  // Guardar en caché local
  localStorage.setItem(CACHE_PREFIX + key, json);
}

export const platformConfigService = {
  loadConfig,
  saveConfig,

  loadManifest: (fallback: Record<string, { enabled: boolean; order: number }>) =>
    loadConfig<Record<string, { enabled: boolean; order: number }>>('enterhr_manifest', fallback),

  saveManifest: (data: Record<string, { enabled: boolean; order: number }>) =>
    saveConfig('enterhr_manifest', data),

  loadRoles: (fallback: { id: string; name: string; description: string; isSystem: boolean; permissions: string[] }[]) =>
    loadConfig('enterhr_roles', fallback),

  saveRoles: (data: { id: string; name: string; description: string; isSystem: boolean; permissions: string[] }[]) =>
    saveConfig('enterhr_roles', data),

  loadAssignments: (fallback: { userEmail: string; userName: string; customRoleIds: string[] }[]) =>
    loadConfig('enterhr_assignments', fallback),

  saveAssignments: (data: { userEmail: string; userName: string; customRoleIds: string[] }[]) =>
    saveConfig('enterhr_assignments', data),

  loadBranding: (fallback: { companyLogoUrl: string | null; companyName: string | null }) =>
    loadConfig<{ companyLogoUrl: string | null; companyName: string | null }>('enterhr_branding', fallback),

  saveBranding: (data: { companyLogoUrl: string | null; companyName: string | null }) =>
    saveConfig('enterhr_branding', data),
};
