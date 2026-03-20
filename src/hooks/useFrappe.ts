import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  departmentService,
  designationService,
  companyService,
  branchService,
  employmentTypeService,
  genderService,
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
  employeeDocumentService,
  noticeService,
  employeeProfileService,
  surveyService,
  incapacityService,
  disciplineService,
  equipmentService,
  onboardingService,
  analyticsService,
  loanService,
  savingsFundService,
  travelService,
  benefitsService,
  movementsService,
  separationService,
  shiftService,
  checkinService,
  grievanceService,
  skillMapService,
  interviewService,
  jobOfferService,
  trainingProgramService,
  trainingResultService,
  goalService,
  attendanceRequestService,
  salaryStructureService,
  additionalSalaryService,
  employeeAdvanceService,
  leaveTypeService,
  leaveAllocationService,
  leavePolicyService,
  holidayListService,
  compensatoryLeaveService,
  leaveEncashmentService,
  documentTemplateService,
} from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import { useModuleStore } from '@/store/moduleStore';
import { toast } from '@/components/ui/Toast';

// ============================================
// DASHBOARD
// ============================================
export function useDashboardStats() {
  const manifest = useModuleStore((s) => s.manifest);
  // Include relevant module states so React Query re-fetches when they toggle
  const moduleKey = ['reclutamiento', 'vacaciones', 'asistencia']
    .map((m) => manifest[m]?.enabled ? '1' : '0')
    .join(',');

  return useQuery({
    queryKey: ['dashboard-stats', moduleKey],
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
    staleTime: 30_000,
  });
}

export function useEmployee(name: string) {
  return useQuery({
    queryKey: ['employee', name],
    queryFn: () => employeeService.get(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      employeeService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, status }: { name: string; status: 'Active' | 'Inactive' | 'Suspended' | 'Left' }) =>
      employeeService.updateStatus(name, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
    onError: (error) => toast.fromError(error),
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
// GENDERS
// ============================================
export function useGenders() {
  return useQuery({
    queryKey: ['genders'],
    queryFn: genderService.list,
    staleTime: 300_000,
  });
}

// ============================================
// EMPLOYMENT TYPES
// ============================================
export function useEmploymentTypes() {
  return useQuery({
    queryKey: ['employment-types'],
    queryFn: employmentTypeService.list,
    staleTime: 300_000,
  });
}

// ============================================
// CATALOG MUTATIONS
// ============================================
export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      departmentService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: designationService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['designations'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      designationService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['designations'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: designationService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['designations'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      companyService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      branchService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateEmploymentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employmentTypeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employment-types'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateEmploymentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      employmentTypeService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employment-types'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteEmploymentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employmentTypeService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employment-types'] }),
    onError: (error) => toast.fromError(error),
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
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// LEAVES
// ============================================
export function useLeaves(filters?: Record<string, unknown>, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['leaves', filters, limit, offset],
    queryFn: () => leaveService.list({ filters, limit, offset }),
    staleTime: 30_000,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// ATTENDANCE
// ============================================
export function useAttendance(filters?: Record<string, unknown>, limit = 50) {
  return useQuery({
    queryKey: ['attendance', filters, limit],
    queryFn: () => attendanceService.list({ filters, limit }),
    staleTime: 30_000,
  });
}

// ============================================
// RECRUITMENT
// ============================================
export function useJobOpenings(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['job-openings', filters],
    queryFn: () => recruitmentService.listOpenings({ filters }),
    staleTime: 60_000,
  });
}

export function useJobApplicants(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['job-applicants', filters],
    queryFn: () => recruitmentService.listApplicants({ filters }),
    staleTime: 60_000,
  });
}

export function useCreateJobOpening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recruitmentService.createOpening,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-openings'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recruitmentService.createApplicant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-applicants'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// PERFORMANCE
// ============================================
export function useAppraisals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['appraisals', filters],
    queryFn: () => performanceService.list({ filters }),
    staleTime: 60_000,
  });
}

export function useAppraisal(name: string) {
  return useQuery({
    queryKey: ['appraisal', name],
    queryFn: () => performanceService.get(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

// ============================================
// PAYROLL
// ============================================
export function useSalarySlips(filters?: Record<string, unknown>, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['salary-slips', filters, limit, offset],
    queryFn: () => payrollService.listSlips({ filters, limit, offset }),
    staleTime: 60_000,
  });
}

export function usePayrollEntries(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payroll-entries', filters],
    queryFn: () => payrollService.listPayrollEntries({ filters }),
    staleTime: 60_000,
  });
}

// ============================================
// EXPENSES
// ============================================
export function useExpenseClaims(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['expense-claims', filters],
    queryFn: () => expenseService.list({ filters }),
    staleTime: 60_000,
  });
}

// ============================================
// TRAINING
// ============================================
export function useTrainingEvents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['training-events', filters],
    queryFn: () => trainingService.list({ filters }),
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 30_000,
  });
}

/**
 * Obtiene las evaluaciones de desempeño del empleado actual.
 */
export function useMyAppraisals() {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['my-appraisals', employeeId],
    queryFn: () => performanceService.list({ filters: { employee: employeeId } }),
    enabled: !!employeeId,
    staleTime: 60_000,
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
    staleTime: 30_000,
  });
}

// ============================================
// EXTENDED HOOKS
// ============================================

export function useEmployeeFullProfile(id: string) {
  const manifest = useModuleStore((s) => s.manifest);
  // Build a module key so React Query re-fetches when relevant modules toggle
  const moduleKey = ['prestaciones', 'nomina', 'vacaciones', 'capacitacion']
    .map((m) => manifest[m]?.enabled ? '1' : '0')
    .join(',');

  return useQuery({
    queryKey: ['employee-full-profile', id, moduleKey],
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
    staleTime: 60_000,
  });
}

export function useEmployeeContracts(id: string) {
  return useQuery({
    queryKey: ['employee-contracts', id],
    queryFn: () => contractService.listByEmployee(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bankAccountService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-bank-accounts'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contractService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-contracts'] }),
    onError: (error) => toast.fromError(error),
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
    onError: (error) => toast.fromError(error),
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
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      noticeService.update(name, data as Parameters<typeof noticeService.update>[1]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => noticeService.delete(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// EMPLOYEE DOCUMENTS
// ============================================

export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => employeeDocumentService.listByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useUploadEmployeeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, file }: { employeeId: string; file: File }) =>
      employeeDocumentService.upload(employeeId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-documents'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteEmployeeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeDocumentService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-documents'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// SURVEYS (Encuestas)
// ============================================
export function useSurveys(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['surveys', filters],
    queryFn: () => surveyService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useSurvey(name: string) {
  return useQuery({
    queryKey: ['survey', name],
    queryFn: () => surveyService.get(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: surveyService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      surveyService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: surveyService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useSurveyResponses(surveyName: string) {
  return useQuery({
    queryKey: ['survey-responses', surveyName],
    queryFn: () => surveyService.listResponses(surveyName),
    enabled: !!surveyName,
    staleTime: 30_000,
  });
}

// ============================================
// INCAPACITIES (Incapacidades)
// ============================================
export function useIncapacities(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['incapacities', filters],
    queryFn: () => incapacityService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useCreateIncapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: incapacityService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incapacities'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateIncapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      incapacityService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incapacities'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteIncapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: incapacityService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incapacities'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// DISCIPLINE (Disciplina)
// ============================================
export function useDisciplinaryActions(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['disciplinary-actions', filters],
    queryFn: () => disciplineService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useCreateDisciplinaryAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disciplineService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinary-actions'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateDisciplinaryAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      disciplineService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinary-actions'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteDisciplinaryAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disciplineService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinary-actions'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// EQUIPMENT (Equipamiento)
// ============================================
export function useEquipmentAssignments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['equipment-assignments', filters],
    queryFn: () => equipmentService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useCreateEquipmentAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment-assignments'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateEquipmentAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      equipmentService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment-assignments'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteEquipmentAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment-assignments'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// ONBOARDING
// ============================================
export function useOnboardingChecklists(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['onboarding-checklists', filters],
    queryFn: () => onboardingService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useCreateOnboardingChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onboardingService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-checklists'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateOnboardingChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      onboardingService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-checklists'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteOnboardingChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onboardingService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-checklists'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// ANALYTICS (People Analytics / Rotación)
// ============================================
export function useAllEmployeesAnalytics() {
  return useQuery({
    queryKey: ['analytics-employees'],
    queryFn: analyticsService.allEmployees,
    staleTime: 120_000,
  });
}

export function useAllSalarySlipsAnalytics(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['analytics-salary-slips', filters],
    queryFn: () => analyticsService.allSalarySlips(filters),
    staleTime: 120_000,
  });
}

// ============================================
// LOANS (Préstamos)
// ============================================
export function useLoans(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['loans', filters], queryFn: () => loanService.list({ filters }), staleTime: 30_000 });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: loanService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// SAVINGS FUND (Fondo de Ahorro)
// ============================================
export function useSavingsFund(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['savings-fund', filters], queryFn: () => savingsFundService.list({ filters }), staleTime: 30_000 });
}

export function useCreateSavingsFundEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: savingsFundService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-fund'] }), onError: (error) => toast.fromError(error) });
}

export function useDeleteSavingsFundEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: savingsFundService.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-fund'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// TRAVEL REQUESTS (Viáticos)
// ============================================
export function useTravelRequests(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['travel-requests', filters], queryFn: () => travelService.list({ filters }), staleTime: 30_000 });
}

export function useCreateTravelRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: travelService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['travel-requests'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// BENEFITS (Prestaciones)
// ============================================
export function useBenefitEntries(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['benefit-entries', filters], queryFn: () => benefitsService.list({ filters }), staleTime: 30_000 });
}

export function useBenefitEntriesByEmployee(employeeId: string) {
  return useQuery({
    queryKey: ['benefit-entries-by-employee', employeeId],
    queryFn: async () => {
      const all = await benefitsService.list();
      return all.filter((b) => b.employee === employeeId);
    },
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useCreateBenefitEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: benefitsService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['benefit-entries'] }), onError: (error) => toast.fromError(error) });
}

export function useDeleteBenefitEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: benefitsService.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['benefit-entries'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// MOVEMENTS (Promociones + Transferencias)
// ============================================
export function usePromotions(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['promotions', filters], queryFn: () => movementsService.listPromotions({ filters }), staleTime: 60_000 });
}

export function useTransfers(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['transfers', filters], queryFn: () => movementsService.listTransfers({ filters }), staleTime: 60_000 });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: movementsService.createPromotion, onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }), onError: (error) => toast.fromError(error) });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: movementsService.createTransfer, onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// SEPARATIONS (Separaciones)
// ============================================
export function useSeparations(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['separations', filters], queryFn: () => separationService.list({ filters }), staleTime: 30_000 });
}

export function useCreateSeparation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: separationService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['separations'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// SHIFTS (Turnos)
// ============================================
export function useShiftTypes() {
  return useQuery({ queryKey: ['shift-types'], queryFn: shiftService.listTypes, staleTime: 300_000 });
}

export function useShiftAssignments(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['shift-assignments', filters], queryFn: () => shiftService.listAssignments({ filters }), staleTime: 30_000 });
}

export function useCreateShiftAssignment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: shiftService.createAssignment, onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-assignments'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// CHECKINS (Checadas)
// ============================================
export function useCheckins(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['checkins', filters], queryFn: () => checkinService.list({ filters }), staleTime: 30_000 });
}

// ============================================
// GRIEVANCES (Quejas)
// ============================================
export function useGrievances(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['grievances', filters], queryFn: () => grievanceService.list({ filters }), staleTime: 30_000 });
}

export function useCreateGrievance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: grievanceService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['grievances'] }), onError: (error) => toast.fromError(error) });
}

export function useUpdateGrievance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      grievanceService.update(name, data as Parameters<typeof grievanceService.update>[1]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grievances'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// SKILL MAPS (Habilidades)
// ============================================
export function useSkillMaps(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['skill-maps', filters], queryFn: () => skillMapService.list({ filters }), staleTime: 60_000 });
}

export function useCreateSkillMap() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: skillMapService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['skill-maps'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// INTERVIEWS (Entrevistas)
// ============================================
export function useInterviews(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['interviews', filters], queryFn: () => interviewService.list({ filters }), staleTime: 30_000 });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: interviewService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// JOB OFFERS (Ofertas de Trabajo)
// ============================================
export function useJobOffers(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['job-offers', filters], queryFn: () => jobOfferService.list({ filters }), staleTime: 30_000 });
}

export function useCreateJobOffer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: jobOfferService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['job-offers'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// TRAINING PROGRAMS (Programas de Capacitación)
// ============================================
export function useTrainingPrograms(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-programs', filters], queryFn: () => trainingProgramService.list({ filters }), staleTime: 60_000 });
}

export function useCreateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: trainingProgramService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['training-programs'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// TRAINING RESULTS (Resultados de Capacitación)
// ============================================
export function useTrainingResults(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-results', filters], queryFn: () => trainingResultService.list({ filters }), staleTime: 60_000 });
}

export function useCreateTrainingResult() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: trainingResultService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['training-results'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// GOALS (Objetivos)
// ============================================
export function useGoals(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['goals', filters], queryFn: () => goalService.list({ filters }), staleTime: 60_000 });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: goalService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }), onError: (error) => toast.fromError(error) });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) => goalService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error) => toast.fromError(error),
  });
}

// ============================================
// ATTENDANCE REQUESTS (Solicitudes de Asistencia)
// ============================================
export function useAttendanceRequests(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['attendance-requests', filters], queryFn: () => attendanceRequestService.list({ filters }), staleTime: 30_000 });
}

export function useCreateAttendanceRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: attendanceRequestService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-requests'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// SALARY STRUCTURES (Estructuras Salariales)
// ============================================
export function useSalaryStructures(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['salary-structures', filters], queryFn: () => salaryStructureService.list({ filters }), staleTime: 60_000 });
}

// ============================================
// ADDITIONAL SALARIES (Salario Adicional)
// ============================================
export function useAdditionalSalaries(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['additional-salaries', filters], queryFn: () => additionalSalaryService.list({ filters }), staleTime: 30_000 });
}

export function useCreateAdditionalSalary() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: additionalSalaryService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['additional-salaries'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// EMPLOYEE ADVANCES (Anticipos)
// ============================================
export function useEmployeeAdvances(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['employee-advances', filters], queryFn: () => employeeAdvanceService.list({ filters }), staleTime: 30_000 });
}

export function useCreateEmployeeAdvance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: employeeAdvanceService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-advances'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// LEAVE TYPES (Tipos de Permiso)
// ============================================
export function useLeaveTypes() {
  return useQuery({ queryKey: ['leave-types'], queryFn: leaveTypeService.list, staleTime: 300_000 });
}

// ============================================
// LEAVE ALLOCATIONS (Asignaciones de Permiso)
// ============================================
export function useLeaveAllocations(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['leave-allocations', filters], queryFn: () => leaveAllocationService.list({ filters }), staleTime: 30_000 });
}

export function useCreateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: leaveAllocationService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-allocations'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// LEAVE POLICIES (Políticas de Permiso)
// ============================================
export function useLeavePolicies() {
  return useQuery({ queryKey: ['leave-policies'], queryFn: leavePolicyService.list, staleTime: 300_000 });
}

// ============================================
// HOLIDAY LISTS (Días Festivos)
// ============================================
export function useHolidayLists() {
  return useQuery({ queryKey: ['holiday-lists'], queryFn: holidayListService.list, staleTime: 300_000 });
}

// ============================================
// COMPENSATORY LEAVE REQUESTS
// ============================================
export function useCompensatoryLeaves(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['compensatory-leaves', filters], queryFn: () => compensatoryLeaveService.list({ filters }), staleTime: 30_000 });
}

export function useCreateCompensatoryLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: compensatoryLeaveService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['compensatory-leaves'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// LEAVE ENCASHMENTS
// ============================================
export function useLeaveEncashments(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['leave-encashments', filters], queryFn: () => leaveEncashmentService.list({ filters }), staleTime: 30_000 });
}

export function useCreateLeaveEncashment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: leaveEncashmentService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-encashments'] }), onError: (error) => toast.fromError(error) });
}

// ============================================
// DOCUMENT TEMPLATES (Documentos HR)
// ============================================
export function useDocumentTemplates(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['document-templates', filters],
    queryFn: () => documentTemplateService.list({ filters }),
    staleTime: 30_000,
  });
}

export function useCreateDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentTemplateService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useUpdateDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      documentTemplateService.update(name, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
    onError: (error) => toast.fromError(error),
  });
}

export function useDeleteDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentTemplateService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
    onError: (error) => toast.fromError(error),
  });
}
