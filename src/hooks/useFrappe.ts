import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  departmentService,
  designationService,
  companyService,
  branchService,
  catalogService,
  leaveService,
  attendanceService,
  recruitmentService,
  performanceService,
  payrollService,
  expenseService,
  trainingService,
  dashboardService,
  bankAccountService,
  contractService,
  noticeService,
  employeeProfileService,
} from '@/api/services';
import { useAuthStore } from '@/store/authStore';

// ============================================
// DASHBOARD
// ============================================
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    staleTime: 60_000,
  });
}

// ============================================
// EMPLOYEES
// ============================================
export function useEmployees(filters?: Record<string, unknown>, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['employees', filters, limit, offset],
    queryFn: () => employeeService.list({ filters, limit, offset }),
  });
}

export function useEmployee(name: string) {
  return useQuery({
    queryKey: ['employee', name],
    queryFn: () => employeeService.get(name),
    enabled: !!name,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      employeeService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

// ============================================
// DEPARTMENTS
// ============================================
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 300_000,
  });
}

// ============================================
// DESIGNATIONS
// ============================================
export function useDesignations() {
  return useQuery({
    queryKey: ['designations'],
    queryFn: designationService.list,
    staleTime: 300_000,
  });
}

// ============================================
// COMPANIES
// ============================================
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: companyService.list,
    staleTime: 300_000,
  });
}

// ============================================
// BRANCHES
// ============================================
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: branchService.list,
    staleTime: 300_000,
  });
}

// ============================================
// CATALOG ENSURE EXISTS
// ============================================
export function useEnsureCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctype, data }: { doctype: string; data: Record<string, unknown> }) =>
      catalogService.ensureExists(doctype, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['designations'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

// ============================================
// LEAVES
// ============================================
export function useLeaves(filters?: Record<string, unknown>, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['leaves', filters, limit, offset],
    queryFn: () => leaveService.list({ filters, limit, offset }),
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });
}

// ============================================
// ATTENDANCE
// ============================================
export function useAttendance(filters?: Record<string, unknown>, limit = 50) {
  return useQuery({
    queryKey: ['attendance', filters, limit],
    queryFn: () => attendanceService.list({ filters, limit }),
  });
}

// ============================================
// RECRUITMENT
// ============================================
export function useJobOpenings(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['job-openings', filters],
    queryFn: () => recruitmentService.listOpenings({ filters }),
  });
}

export function useJobApplicants(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['job-applicants', filters],
    queryFn: () => recruitmentService.listApplicants({ filters }),
  });
}

export function useCreateJobOpening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recruitmentService.createOpening,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-openings'] }),
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recruitmentService.createApplicant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-applicants'] }),
  });
}

// ============================================
// PERFORMANCE
// ============================================
export function useAppraisals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['appraisals', filters],
    queryFn: () => performanceService.list({ filters }),
  });
}

export function useAppraisal(name: string) {
  return useQuery({
    queryKey: ['appraisal', name],
    queryFn: () => performanceService.get(name),
    enabled: !!name,
  });
}

// ============================================
// PAYROLL
// ============================================
export function useSalarySlips(filters?: Record<string, unknown>, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['salary-slips', filters, limit, offset],
    queryFn: () => payrollService.listSlips({ filters, limit, offset }),
  });
}

export function usePayrollEntries(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payroll-entries', filters],
    queryFn: () => payrollService.listPayrollEntries({ filters }),
  });
}

// ============================================
// EXPENSES
// ============================================
export function useExpenseClaims(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['expense-claims', filters],
    queryFn: () => expenseService.list({ filters }),
  });
}

// ============================================
// TRAINING
// ============================================
export function useTrainingEvents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['training-events', filters],
    queryFn: () => trainingService.list({ filters }),
  });
}

// ============================================
// SELF-SERVICE (PORTAL DE EMPLEADO)
// ============================================

/**
 * Obtiene los datos del Employee vinculado al usuario actual.
 */
export function useMyEmployee() {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['my-employee', employeeId],
    queryFn: () => employeeService.get(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Obtiene los recibos de nómina del empleado actual.
 */
export function useMySalarySlips(limit = 20, offset = 0) {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['my-salary-slips', employeeId, limit, offset],
    queryFn: () =>
      payrollService.listSlips({
        filters: { employee: employeeId },
        limit,
        offset,
      }),
    enabled: !!employeeId,
  });
}

/**
 * Obtiene la asistencia del empleado actual.
 */
export function useMyAttendance(filters?: Record<string, unknown>, limit = 50) {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['my-attendance', employeeId, filters, limit],
    queryFn: () =>
      attendanceService.list({
        filters: { employee: employeeId, ...filters },
        limit,
      }),
    enabled: !!employeeId,
  });
}

/**
 * Obtiene las solicitudes de permiso del empleado actual.
 */
export function useMyLeaves(filters?: Record<string, unknown>, limit = 20) {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['my-leaves', employeeId, filters, limit],
    queryFn: () =>
      leaveService.list({
        filters: { employee: employeeId, ...filters },
        limit,
      }),
    enabled: !!employeeId,
  });
}

// ============================================
// EXTENDED HOOKS
// ============================================

export function useEmployeeFullProfile(id: string) {
  return useQuery({
    queryKey: ['employee-full-profile', id],
    queryFn: () => employeeProfileService.getFullProfile(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useEmployeeBankAccounts(id: string) {
  return useQuery({
    queryKey: ['employee-bank-accounts', id],
    queryFn: () => bankAccountService.listByEmployee(id),
    enabled: !!id,
  });
}

export function useEmployeeContracts(id: string) {
  return useQuery({
    queryKey: ['employee-contracts', id],
    queryFn: () => contractService.listByEmployee(id),
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bankAccountService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-bank-accounts'] }),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contractService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-contracts'] }),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      employeeService.update(employeeId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-employee'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useNotices(limit = 50) {
  return useQuery({
    queryKey: ['notices', limit],
    queryFn: () => noticeService.list({ limit }),
    staleTime: 30_000,
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: noticeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  });
}
