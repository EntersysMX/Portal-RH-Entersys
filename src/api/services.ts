import {
  frappeGetList,
  frappeGetDoc,
  frappeCreateDoc,
  frappeUpdateDoc,
  frappeDeleteDoc,
  frappeGetCount,
  frappeCall,
} from './client';
import type {
  Employee,
  Department,
  Designation,
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
