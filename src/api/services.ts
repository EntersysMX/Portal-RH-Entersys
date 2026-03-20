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
import { isModuleEnabled } from '@/modules/registry';
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
  Survey,
  SurveyResponse,
  Incapacity,
  DisciplinaryAction,
  EquipmentAssignment,
  OnboardingChecklist,
  Loan,
  TravelRequest,
  EmployeePromotion,
  EmployeeTransfer,
  EmployeeSeparation,
  ShiftType,
  ShiftAssignment,
  EmployeeCheckin,
  EmployeeGrievance,
  EmployeeSkillMap,
  SavingsFundEntry,
  BenefitEntry,
  Interview,
  JobOffer,
  TrainingProgram,
  TrainingResult,
  Goal,
  AttendanceRequest,
  SalaryStructure,
  AdditionalSalary,
  EmployeeAdvance,
  LeaveType,
  LeaveAllocation,
  LeavePolicy,
  HolidayList,
  CompensatoryLeaveRequest,
  LeaveEncashment,
  DocumentTemplate,
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

/**
 * Crea un usuario de Frappe para un empleado recién creado.
 * - Email = personal_email o company_email del empleado
 * - Contraseña = RFC del empleado
 * - Rol = Employee (el más bajo, solo portal de autoservicio)
 * - send_welcome_email = 0 para no mandar correo
 * Si falla (email duplicado, permisos), no bloquea la creación del empleado.
 */
export async function createUserForEmployee(params: {
  email: string;
  firstName: string;
  lastName: string;
  rfc: string;
  employeeId: string;
}): Promise<void> {
  const { email, firstName, lastName, rfc, employeeId } = params;

  // 1. Crear el usuario con contraseña = RFC
  await frappeCreateDoc('User', {
    email,
    first_name: firstName,
    last_name: lastName,
    new_password: rfc,
    send_welcome_email: 0,
    enabled: 1,
    user_type: 'Website User',
    roles: [{ role: 'Employee' }],
  } as Record<string, unknown>);

  // 2. Vincular el usuario al empleado (user_id)
  await frappeUpdateDoc('Employee', employeeId, { user_id: email });
}

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

    // Cada llamada individual tiene catch para no bloquear si un doctype falla
    // Módulos opcionales solo se consultan si están habilitados
    const [
      totalEmployees,
      activeEmployees,
      newHires,
      openPositions,
      pendingLeaves,
      attendanceToday,
      departments,
    ] = await withTimeout(
      Promise.all([
        frappeGetCount({ doctype: 'Employee' }).catch(() => 0),
        frappeGetCount({ doctype: 'Employee', filters: { status: 'Active' } }).catch(() => 0),
        frappeGetCount({
          doctype: 'Employee',
          filters: [['date_of_joining', '>=', monthStart]],
        }).catch(() => 0),
        isModuleEnabled('reclutamiento')
          ? frappeGetCount({ doctype: 'Job Opening', filters: { status: 'Open' } }).catch(() => 0)
          : Promise.resolve(0),
        isModuleEnabled('vacaciones')
          ? frappeGetCount({ doctype: 'Leave Application', filters: { status: 'Open' } }).catch(() => 0)
          : Promise.resolve(0),
        isModuleEnabled('asistencia')
          ? frappeGetCount({
              doctype: 'Attendance',
              filters: { attendance_date: today, status: 'Present' },
            }).catch(() => 0)
          : Promise.resolve(0),
        frappeGetList<{ department: string; count: number }>({
          doctype: 'Employee',
          fields: ['department', 'count(name) as count'],
          filters: { status: 'Active' },
          group_by: 'department',
          limit_page_length: 50,
        }).catch(() => []),
      ]),
      15_000, // 15s timeout para todo el bloque de stats
    );

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
      monthly_payroll_cost: 0,
      avg_cost_per_employee: 0,
      turnover_rate: 0,
      active_trainings: 0,
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
      isModuleEnabled('prestaciones')
        ? benefitService.listByEmployee(employeeId).catch(() => [])
        : Promise.resolve([]),
      isModuleEnabled('nomina')
        ? payrollService.listSlips({ filters: { employee: employeeId }, limit: 12 }).catch(() => [])
        : Promise.resolve([]),
      isModuleEnabled('vacaciones')
        ? leaveService.list({ filters: { employee: employeeId }, limit: 20 }).catch(() => [])
        : Promise.resolve([]),
      isModuleEnabled('capacitacion')
        ? trainingService.list({ limit: 10 }).catch(() => [])
        : Promise.resolve([]),
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
// NOTE-BASED CRUD STORE
// Los módulos nuevos (Survey, Incapacity, etc.) no tienen
// doctype en Frappe. Usamos Notes como key-value store JSON
// (mismo patrón que platformConfigService).
// Cada "colección" es un Note con título enterhr_<key>
// y content = JSON array de registros.
// ============================================

/** Genera un ID único corto para registros */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** CRUD genérico sobre Note-based store */
function noteStore<T extends { name: string }>(storeKey: string, idPrefix: string) {
  const load = (): Promise<T[]> => loadConfig<T[]>(storeKey, []);
  const save = (items: T[]): Promise<void> => saveConfig(storeKey, items);

  return {
    list: async (_params?: { filters?: Record<string, unknown>; limit?: number }): Promise<T[]> => {
      const items = await load();
      // Basic client-side filtering
      if (_params?.filters) {
        return items.filter((item) => {
          return Object.entries(_params.filters!).every(([key, val]) => {
            return (item as Record<string, unknown>)[key] === val;
          });
        });
      }
      return items;
    },

    get: async (name: string): Promise<T> => {
      const items = await load();
      const found = items.find((i) => i.name === name);
      if (!found) throw new Error(`${storeKey}: ${name} not found`);
      return found;
    },

    create: async (data: Partial<T>): Promise<T> => {
      const items = await load();
      const newItem = { ...data, name: generateId(idPrefix), creation: new Date().toISOString() } as unknown as T;
      items.unshift(newItem);
      try {
        await save(items);
      } catch (err) {
        console.error(`[noteStore:${storeKey}] Error al guardar:`, err);
        throw err;
      }
      return newItem;
    },

    update: async (name: string, data: Partial<T>): Promise<T> => {
      const items = await load();
      const idx = items.findIndex((i) => i.name === name);
      if (idx === -1) throw new Error(`${storeKey}: ${name} not found`);
      items[idx] = { ...items[idx], ...data };
      await save(items);
      return items[idx];
    },

    delete: async (name: string): Promise<void> => {
      const items = await load();
      const filtered = items.filter((i) => i.name !== name);
      await save(filtered);
    },
  };
}

// ============================================
// SURVEY SERVICE (Encuestas)
// ============================================
const _surveyStore = noteStore<Survey>('enterhr_surveys', 'SUR');
const _responseStore = noteStore<SurveyResponse>('enterhr_survey_responses', 'SRES');

export const surveyService = {
  list: _surveyStore.list,
  get: _surveyStore.get,
  create: _surveyStore.create,
  update: (name: string, data: Partial<Survey>) => _surveyStore.update(name, data),
  delete: _surveyStore.delete,
  listResponses: (surveyName: string) => _responseStore.list({ filters: { survey: surveyName } }),
  submitResponse: _responseStore.create,
};

// ============================================
// INCAPACITY SERVICE (Incapacidades)
// ============================================
const _incapacityStore = noteStore<Incapacity>('enterhr_incapacities', 'INC');

export const incapacityService = {
  list: _incapacityStore.list,
  get: _incapacityStore.get,
  create: _incapacityStore.create,
  update: (name: string, data: Partial<Incapacity>) => _incapacityStore.update(name, data),
  delete: _incapacityStore.delete,
};

// ============================================
// DISCIPLINE SERVICE (Disciplina)
// ============================================
const _disciplineStore = noteStore<DisciplinaryAction>('enterhr_discipline', 'DIS');

export const disciplineService = {
  list: _disciplineStore.list,
  get: _disciplineStore.get,
  create: _disciplineStore.create,
  update: (name: string, data: Partial<DisciplinaryAction>) => _disciplineStore.update(name, data),
  delete: _disciplineStore.delete,
};

// ============================================
// EQUIPMENT SERVICE (Equipamiento)
// ============================================
const _equipmentStore = noteStore<EquipmentAssignment>('enterhr_equipment', 'EQP');

export const equipmentService = {
  list: _equipmentStore.list,
  get: _equipmentStore.get,
  create: _equipmentStore.create,
  update: (name: string, data: Partial<EquipmentAssignment>) => _equipmentStore.update(name, data),
  delete: _equipmentStore.delete,
};

// ============================================
// ONBOARDING SERVICE
// ============================================
const _onboardingStore = noteStore<OnboardingChecklist>('enterhr_onboarding', 'ONB');

export const onboardingService = {
  list: _onboardingStore.list,
  get: _onboardingStore.get,
  create: _onboardingStore.create,
  update: (name: string, data: Partial<OnboardingChecklist>) => _onboardingStore.update(name, data),
  delete: _onboardingStore.delete,
};

// ============================================
// ANALYTICS SERVICE (People Analytics / Rotación)
// Calcula métricas client-side desde Employee y SalarySlip
// ============================================
export const analyticsService = {
  /** All employees for analytics (large fetch) */
  allEmployees: () =>
    frappeGetList<Employee>({
      doctype: 'Employee',
      fields: ['name', 'employee_name', 'status', 'gender', 'date_of_birth', 'date_of_joining',
        'relieving_date', 'department', 'designation', 'company', 'reason_for_leaving', 'ctc'],
      limit_page_length: 0, // all
    }),

  /** All salary slips for cost analytics */
  allSalarySlips: (filters?: Record<string, unknown>) =>
    frappeGetList<SalarySlip>({
      doctype: 'Salary Slip',
      fields: ['employee', 'employee_name', 'department', 'gross_pay', 'net_pay', 'total_deduction',
        'posting_date', 'start_date', 'end_date', 'status'],
      filters: { status: 'Submitted', ...filters },
      limit_page_length: 0,
    }),
};

// ============================================
// LOAN SERVICE (Préstamos - Frappe HR)
// ============================================
export const loanService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<Loan>({
      doctype: 'Loan',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'posting_date desc',
    }).catch(() => []),

  get: (name: string) => frappeGetDoc<Loan>('Loan', name),

  create: (data: Partial<Loan>) => frappeCreateDoc<Loan>('Loan', data),

  update: (name: string, data: Partial<Loan>) =>
    frappeUpdateDoc<Loan>('Loan', name, data),

  delete: (name: string) => frappeDeleteDoc('Loan', name),
};

// ============================================
// SAVINGS FUND SERVICE (Fondo de Ahorro - Custom Note-based)
// ============================================
const _savingsStore = noteStore<SavingsFundEntry>('enterhr_savings_fund', 'SAV');

export const savingsFundService = {
  list: _savingsStore.list,
  get: _savingsStore.get,
  create: _savingsStore.create,
  update: (name: string, data: Partial<SavingsFundEntry>) => _savingsStore.update(name, data),
  delete: _savingsStore.delete,
};

// ============================================
// TRAVEL REQUEST SERVICE (Viáticos - Frappe HR)
// ============================================
export const travelService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<TravelRequest>({
      doctype: 'Travel Request',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  get: (name: string) => frappeGetDoc<TravelRequest>('Travel Request', name),

  create: (data: Partial<TravelRequest>) => frappeCreateDoc<TravelRequest>('Travel Request', data),

  update: (name: string, data: Partial<TravelRequest>) =>
    frappeUpdateDoc<TravelRequest>('Travel Request', name, data),

  delete: (name: string) => frappeDeleteDoc('Travel Request', name),
};

// ============================================
// BENEFITS SERVICE (Prestaciones - Custom Note-based)
// ============================================
const _benefitsStore = noteStore<BenefitEntry>('enterhr_benefits', 'BEN');

export const benefitsService = {
  list: _benefitsStore.list,
  get: _benefitsStore.get,
  create: _benefitsStore.create,
  update: (name: string, data: Partial<BenefitEntry>) => _benefitsStore.update(name, data),
  delete: _benefitsStore.delete,
};

// ============================================
// MOVEMENTS SERVICE (Promociones + Transferencias - Frappe HR)
// ============================================
export const movementsService = {
  listPromotions: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeePromotion>({
      doctype: 'Employee Promotion',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'promotion_date desc',
    }).catch(() => []),

  createPromotion: (data: Partial<EmployeePromotion>) =>
    frappeCreateDoc<EmployeePromotion>('Employee Promotion', data),

  listTransfers: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeTransfer>({
      doctype: 'Employee Transfer',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'transfer_date desc',
    }).catch(() => []),

  createTransfer: (data: Partial<EmployeeTransfer>) =>
    frappeCreateDoc<EmployeeTransfer>('Employee Transfer', data),
};

// ============================================
// SEPARATION SERVICE (Separaciones - Frappe HR)
// ============================================
export const separationService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeSeparation>({
      doctype: 'Employee Separation',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  get: (name: string) => frappeGetDoc<EmployeeSeparation>('Employee Separation', name),

  create: (data: Partial<EmployeeSeparation>) =>
    frappeCreateDoc<EmployeeSeparation>('Employee Separation', data),

  update: (name: string, data: Partial<EmployeeSeparation>) =>
    frappeUpdateDoc<EmployeeSeparation>('Employee Separation', name, data),
};

// ============================================
// SHIFT SERVICE (Turnos - Frappe HR)
// ============================================
export const shiftService = {
  listTypes: () =>
    frappeGetList<ShiftType>({
      doctype: 'Shift Type',
      fields: ['*'],
      limit_page_length: 50,
    }).catch(() => []),

  listAssignments: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<ShiftAssignment>({
      doctype: 'Shift Assignment',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'start_date desc',
    }).catch(() => []),

  createAssignment: (data: Partial<ShiftAssignment>) =>
    frappeCreateDoc<ShiftAssignment>('Shift Assignment', data),

  deleteAssignment: (name: string) => frappeDeleteDoc('Shift Assignment', name),
};

// ============================================
// CHECKIN SERVICE (Checadas - Frappe HR)
// ============================================
export const checkinService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeCheckin>({
      doctype: 'Employee Checkin',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 100,
      order_by: 'time desc',
    }).catch(() => []),
};

// ============================================
// GRIEVANCE SERVICE (Quejas - Frappe HR)
// ============================================
export const grievanceService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeGrievance>({
      doctype: 'Employee Grievance',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'date desc',
    }).catch(() => []),

  get: (name: string) => frappeGetDoc<EmployeeGrievance>('Employee Grievance', name),

  create: (data: Partial<EmployeeGrievance>) =>
    frappeCreateDoc<EmployeeGrievance>('Employee Grievance', data),

  update: (name: string, data: Partial<EmployeeGrievance>) =>
    frappeUpdateDoc<EmployeeGrievance>('Employee Grievance', name, data),
};

// ============================================
// SKILL MAP SERVICE (Habilidades - Frappe HR)
// ============================================
export const skillMapService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeSkillMap>({
      doctype: 'Employee Skill Map',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  get: (name: string) => frappeGetDoc<EmployeeSkillMap>('Employee Skill Map', name),

  create: (data: Partial<EmployeeSkillMap>) =>
    frappeCreateDoc<EmployeeSkillMap>('Employee Skill Map', data),

  update: (name: string, data: Partial<EmployeeSkillMap>) =>
    frappeUpdateDoc<EmployeeSkillMap>('Employee Skill Map', name, data),
};

// ============================================
// INTERVIEW SERVICE (Frappe HR)
// ============================================
export const interviewService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<Interview>({
      doctype: 'Interview',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'scheduled_date desc',
    }).catch(() => []),

  create: (data: Partial<Interview>) =>
    frappeCreateDoc<Interview>('Interview', data),
};

// ============================================
// JOB OFFER SERVICE (Frappe HR)
// ============================================
export const jobOfferService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<JobOffer>({
      doctype: 'Job Offer',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'offer_date desc',
    }).catch(() => []),

  create: (data: Partial<JobOffer>) =>
    frappeCreateDoc<JobOffer>('Job Offer', data),
};

// ============================================
// TRAINING PROGRAM SERVICE (Frappe HR)
// ============================================
export const trainingProgramService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<TrainingProgram>({
      doctype: 'Training Program',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<TrainingProgram>) =>
    frappeCreateDoc<TrainingProgram>('Training Program', data),
};

// ============================================
// TRAINING RESULT SERVICE (Frappe HR)
// ============================================
export const trainingResultService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<TrainingResult>({
      doctype: 'Training Result',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<TrainingResult>) =>
    frappeCreateDoc<TrainingResult>('Training Result', data),
};

// ============================================
// GOAL SERVICE (Frappe HR)
// ============================================
export const goalService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<Goal>({
      doctype: 'Goal',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<Goal>) =>
    frappeCreateDoc<Goal>('Goal', data),

  update: (name: string, data: Partial<Goal>) =>
    frappeUpdateDoc<Goal>('Goal', name, data),
};

// ============================================
// ATTENDANCE REQUEST SERVICE (Frappe HR)
// ============================================
export const attendanceRequestService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<AttendanceRequest>({
      doctype: 'Attendance Request',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<AttendanceRequest>) =>
    frappeCreateDoc<AttendanceRequest>('Attendance Request', data),
};

// ============================================
// SALARY STRUCTURE SERVICE (Frappe HR)
// ============================================
export const salaryStructureService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<SalaryStructure>({
      doctype: 'Salary Structure',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),
};

// ============================================
// ADDITIONAL SALARY SERVICE (Frappe HR)
// ============================================
export const additionalSalaryService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<AdditionalSalary>({
      doctype: 'Additional Salary',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'payroll_date desc',
    }).catch(() => []),

  create: (data: Partial<AdditionalSalary>) =>
    frappeCreateDoc<AdditionalSalary>('Additional Salary', data),
};

// ============================================
// EMPLOYEE ADVANCE SERVICE (Frappe HR)
// ============================================
export const employeeAdvanceService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<EmployeeAdvance>({
      doctype: 'Employee Advance',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'posting_date desc',
    }).catch(() => []),

  create: (data: Partial<EmployeeAdvance>) =>
    frappeCreateDoc<EmployeeAdvance>('Employee Advance', data),
};

// ============================================
// LEAVE TYPE SERVICE (Frappe HR)
// ============================================
export const leaveTypeService = {
  list: () =>
    frappeGetList<LeaveType>({
      doctype: 'Leave Type',
      fields: ['*'],
      limit_page_length: 50,
    }).catch(() => []),
};

// ============================================
// LEAVE ALLOCATION SERVICE (Frappe HR)
// ============================================
export const leaveAllocationService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<LeaveAllocation>({
      doctype: 'Leave Allocation',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<LeaveAllocation>) =>
    frappeCreateDoc<LeaveAllocation>('Leave Allocation', data),
};

// ============================================
// LEAVE POLICY SERVICE (Frappe HR)
// ============================================
export const leavePolicyService = {
  list: () =>
    frappeGetList<LeavePolicy>({
      doctype: 'Leave Policy',
      fields: ['*'],
      limit_page_length: 50,
    }).catch(() => []),
};

// ============================================
// HOLIDAY LIST SERVICE (Frappe HR)
// ============================================
export const holidayListService = {
  list: () =>
    frappeGetList<HolidayList>({
      doctype: 'Holiday List',
      fields: ['*'],
      limit_page_length: 50,
    }).catch(() => []),
};

// ============================================
// COMPENSATORY LEAVE REQUEST SERVICE (Frappe HR)
// ============================================
export const compensatoryLeaveService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<CompensatoryLeaveRequest>({
      doctype: 'Compensatory Leave Request',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<CompensatoryLeaveRequest>) =>
    frappeCreateDoc<CompensatoryLeaveRequest>('Compensatory Leave Request', data),
};

// ============================================
// LEAVE ENCASHMENT SERVICE (Frappe HR)
// ============================================
export const leaveEncashmentService = {
  list: (params?: { filters?: Record<string, unknown>; limit?: number }) =>
    frappeGetList<LeaveEncashment>({
      doctype: 'Leave Encashment',
      fields: ['*'],
      filters: params?.filters,
      limit_page_length: params?.limit || 50,
      order_by: 'creation desc',
    }).catch(() => []),

  create: (data: Partial<LeaveEncashment>) =>
    frappeCreateDoc<LeaveEncashment>('Leave Encashment', data),
};

// ============================================
// DOCUMENT TEMPLATE SERVICE (Documentos HR)
// ============================================
const _docTemplateStore = noteStore<DocumentTemplate>('enterhr_document_templates', 'DOC');

export const documentTemplateService = {
  list: _docTemplateStore.list,
  get: _docTemplateStore.get,
  create: _docTemplateStore.create,
  update: (name: string, data: Partial<DocumentTemplate>) => _docTemplateStore.update(name, data),
  delete: _docTemplateStore.delete,
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

/**
 * Nombre del Note que almacena la config en Frappe.
 * Se usa el doctype Note (estándar en toda instalación de Frappe)
 * como key-value store: title = clave, content = JSON.
 */
function noteTitle(key: string): string {
  return `enterhr_${key}`;
}

async function loadConfig<T>(key: string, fallback: T): Promise<T> {
  // 1. Intentar caché local primero (respuesta instantánea)
  let cached: T | null = null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) cached = JSON.parse(raw) as T;
  } catch { /* ignore corrupt cache */ }

  // 2. Intentar backend — leer Note por título
  try {
    const notes = await withTimeout(
      frappeGetList<{ name: string; content: string }>({
        doctype: 'Note',
        fields: ['name', 'content'],
        filters: { title: noteTitle(key) },
        limit_page_length: 1,
      }),
      CONFIG_TIMEOUT_MS,
    );
    if (notes.length > 0 && notes[0].content) {
      const parsed = JSON.parse(notes[0].content) as T;
      localStorage.setItem(CACHE_PREFIX + key, notes[0].content);
      return parsed;
    }
  } catch {
    // Backend no disponible o timeout → usar caché si existe
    if (cached !== null) return cached;
  }

  // 3. Si no existe el Note, usar caché o fallback
  return cached ?? fallback;
}

async function saveConfig<T>(key: string, data: T): Promise<void> {
  const json = JSON.stringify(data);
  const title = noteTitle(key);

  // Timeout protege contra backend colgado al escribir
  await withTimeout(
    (async () => {
      // 1. Guardar en backend PRIMERO (fuente de verdad)
      // Buscar si ya existe un Note con este título
      const existing = await frappeGetList<{ name: string }>({
        doctype: 'Note',
        fields: ['name'],
        filters: { title },
        limit_page_length: 1,
      });

      if (existing.length > 0) {
        // Actualizar el Note existente
        await frappeUpdateDoc('Note', existing[0].name, { content: json });
      } else {
        // Crear un Note nuevo
        await frappeCreateDoc('Note', { title, content: json, public: 1 });
      }
    })(),
    CONFIG_TIMEOUT_MS,
  );

  // 2. Solo actualizar caché local si el backend tuvo éxito
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

  loadDesignationHierarchy: (fallback: DesignationHierarchyConfig) =>
    loadConfig<DesignationHierarchyConfig>('enterhr_designation_hierarchy', fallback),

  saveDesignationHierarchy: (data: DesignationHierarchyConfig) =>
    saveConfig('enterhr_designation_hierarchy', data),
};

// ============================================
// DESIGNATION HIERARCHY CONFIG
// Metadata de jerarquía almacenada en plataforma
// (no en el doctype Designation de Frappe)
// ============================================
export interface DesignationLevelInfo {
  level: number;            // 1=C-Suite, 2=Director, 3=Gerente, 4=Coordinador, 5=Especialista, 6=Operativo
  parentDesignation?: string;
  isExecutive: boolean;
}

export type DesignationHierarchyConfig = Record<string, DesignationLevelInfo>;

export const DESIGNATION_LEVELS: { value: number; label: string; color: string }[] = [
  { value: 1, label: 'C-Suite / Ejecutivo', color: 'bg-red-100 text-red-700' },
  { value: 2, label: 'Director / VP', color: 'bg-purple-100 text-purple-700' },
  { value: 3, label: 'Gerente / Manager', color: 'bg-blue-100 text-blue-700' },
  { value: 4, label: 'Coordinador / Supervisor', color: 'bg-cyan-100 text-cyan-700' },
  { value: 5, label: 'Especialista / Analista', color: 'bg-green-100 text-green-700' },
  { value: 6, label: 'Asistente / Operativo', color: 'bg-gray-100 text-gray-700' },
];
