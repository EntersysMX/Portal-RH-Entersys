// Frappe API response types

export interface FrappeResponse<T> {
  data: T;
  message?: string;
}

export interface FrappeListResponse<T> {
  data: T[];
}

export interface FrappeLoginResponse {
  message: string;
  home_page: string;
  full_name: string;
  user: string;
}

export interface FrappeUser {
  name: string;
  email: string;
  full_name: string;
  user_image?: string;
  roles: string[];
  employee_id?: string;
  employee_name?: string;
}

// HR Module Types

export interface Employee {
  name: string;
  employee_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  employee_number?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Left';
  gender: string;
  date_of_birth: string;
  date_of_joining: string;
  company: string;
  department: string;
  designation: string;
  branch?: string;
  reports_to?: string;
  employment_type: string;
  cell_phone?: string;
  personal_email?: string;
  company_email?: string;
  image?: string;
  user_id?: string;
  leave_policy?: string;
  holiday_list?: string;
  attendance_device_id?: string;
  ctc?: number;
  salary_mode?: string;
  payroll_cost_center?: string;
  // Extended fields
  linkedin_profile?: string;
  current_address?: string;
  permanent_address?: string;
  marital_status?: string;
  blood_group?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  bank_name?: string;
  bank_ac_no?: string;
  clabe?: string;
  emergency_contact_name?: string;
  emergency_phone?: string;
  relation?: string;
  notice_period?: number;
  relieving_date?: string;
  reason_for_leaving?: string;
  salary_currency?: string;
  bio?: string;
}

export interface Department {
  name: string;
  department_name: string;
  company: string;
  parent_department?: string;
  is_group: boolean;
}

export interface Designation {
  name: string;
  designation: string;
  description?: string;
}

export interface LeaveApplication {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
  leave_approver: string;
  posting_date: string;
  description?: string;
}

export interface Attendance {
  name: string;
  employee: string;
  employee_name: string;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Work From Home' | 'On Leave';
  leave_type?: string;
  late_entry?: boolean;
  early_exit?: boolean;
  shift?: string;
}

export interface JobOpening {
  name: string;
  job_title: string;
  designation: string;
  department: string;
  status: 'Open' | 'Closed';
  description?: string;
  posted_on?: string;
  closes_on?: string;
  company: string;
  location?: string;
  employment_type?: string;
  min_experience?: number;
  max_experience?: number;
  min_salary?: number;
  max_salary?: number;
}

export interface JobApplicant {
  name: string;
  applicant_name: string;
  email_id: string;
  phone?: string;
  job_title: string;
  status: 'Open' | 'Replied' | 'Accepted' | 'Rejected' | 'Hold';
  source?: string;
  resume_attachment?: string;
  rating?: number;
  notes?: string;
}

export interface Appraisal {
  name: string;
  employee: string;
  employee_name: string;
  appraisal_template?: string;
  start_date: string;
  end_date: string;
  status: 'Draft' | 'Submitted' | 'Completed' | 'Cancelled';
  final_score?: number;
  total_score?: number;
  goals: AppraisalGoal[];
}

export interface AppraisalGoal {
  kra: string;
  per_weightage: number;
  score: number;
}

export interface SalarySlip {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  company: string;
  department: string;
  designation: string;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  salary_structure?: string;
}

export interface PayrollEntry {
  name: string;
  company: string;
  posting_date: string;
  payroll_frequency: string;
  start_date: string;
  end_date: string;
  department?: string;
  branch?: string;
  status: string;
}

export interface ExpenseClaim {
  name: string;
  employee: string;
  employee_name: string;
  expense_date: string;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Rejected' | 'Cancelled';
  approval_status: 'Draft' | 'Approved' | 'Rejected';
  expenses: ExpenseClaimItem[];
}

export interface ExpenseClaimItem {
  expense_type: string;
  description?: string;
  amount: number;
  sanctioned_amount: number;
}

export interface TrainingEvent {
  name: string;
  event_name: string;
  type: string;
  level: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  start_time: string;
  end_time: string;
  trainer_name?: string;
  description?: string;
  employees: { employee: string; employee_name: string }[];
}

// ============================================
// SURVEY / ENCUESTAS
// ============================================
export interface Survey {
  name: string;
  title: string;
  description?: string;
  survey_type: 'General' | 'Clima Laboral' | 'Satisfacción' | 'Salida' | 'Otro';
  is_anonymous: boolean;
  status: 'Draft' | 'Active' | 'Closed';
  start_date?: string;
  end_date?: string;
  target_audience: 'all' | string;
  questions: SurveyQuestion[];
  creation?: string;
}

export interface SurveyQuestion {
  idx: number;
  question_text: string;
  question_type: 'open' | 'multiple_choice' | 'likert';
  options?: string;
  required: boolean;
}

export interface SurveyResponse {
  name: string;
  survey: string;
  employee?: string;
  employee_name?: string;
  submitted_at: string;
  answers: { question_idx: number; answer: string }[];
}

// ============================================
// INCAPACIDADES
// ============================================
export interface Incapacity {
  name: string;
  employee: string;
  employee_name: string;
  incapacity_type: 'Enfermedad General' | 'Riesgo de Trabajo' | 'Maternidad' | 'Paternidad';
  folio?: string;
  start_date: string;
  end_date: string;
  days: number;
  estimated_cost?: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  notes?: string;
  creation?: string;
}

// ============================================
// DISCIPLINA
// ============================================
export interface DisciplinaryAction {
  name: string;
  employee: string;
  employee_name: string;
  date: string;
  category: 'EPP' | 'Inocuidad' | 'Conducta' | 'Puntualidad' | 'Otro';
  reason: string;
  sanction_type: 'Verbal' | 'Escrita 1' | 'Escrita 2' | 'Suspensión 1d' | 'Suspensión 3d';
  status: 'Active' | 'Resolved' | 'Cancelled';
  notes?: string;
  creation?: string;
}

// ============================================
// EQUIPAMIENTO
// ============================================
export interface EquipmentAssignment {
  name: string;
  employee: string;
  employee_name: string;
  equipment_type: 'Casco' | 'Chaleco' | 'Botas' | 'Guantes' | 'Uniforme' | 'Laptop' | 'Otro';
  description?: string;
  assigned_date: string;
  return_date?: string;
  status: 'Asignado' | 'Devuelto' | 'Extraviado';
  notes?: string;
  creation?: string;
}

// ============================================
// ONBOARDING / OFFBOARDING
// ============================================
export interface OnboardingChecklist {
  name: string;
  employee: string;
  employee_name: string;
  checklist_type: 'Onboarding' | 'Offboarding';
  status: 'In Progress' | 'Completed' | 'Cancelled';
  progress: number;
  items: OnboardingItem[];
  creation?: string;
}

export interface OnboardingItem {
  idx: number;
  title: string;
  is_completed: boolean;
  completed_date?: string;
  notes?: string;
}

// ============================================
// DOCUMENT TEMPLATES (Documentos HR)
// ============================================
export type DocumentCategory = 'Contrato' | 'Carta de Recomendacion' | 'Constancia' | 'Acta' | 'Memorandum' | 'Otro';

export type DocumentFileType = 'pdf' | 'docx';

export interface DocumentTemplate {
  name: string;
  title: string;
  category: DocumentCategory;
  content: string;           // Texto con {{placeholders}} (legacy, puede estar vacío)
  file_url?: string;         // URL del archivo subido como plantilla
  file_type?: DocumentFileType; // Tipo de archivo: pdf o docx
  status: 'Active' | 'Inactive';
  description?: string;
  creation?: string;
}

// Dashboard stats
export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  new_hires_this_month: number;
  open_positions: number;
  pending_leaves: number;
  attendance_today: number;
  upcoming_birthdays: Employee[];
  department_distribution: { department: string; count: number }[];
  monthly_hiring: { month: string; count: number }[];
  leave_balance_summary: { leave_type: string; total: number; used: number }[];
  monthly_payroll_cost?: number;
  avg_cost_per_employee?: number;
  turnover_rate?: number;
  active_trainings?: number;
}

// Extended employee sub-types

export interface EmployeeBankAccount {
  name: string;
  employee: string;
  bank_name: string;
  bank_account_no: string;
  clabe?: string;
  is_default: boolean;
  currency?: string;
}

export interface EmploymentContract {
  name: string;
  employee: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  salary: number;
  status: 'Active' | 'Expired' | 'Terminated';
}

export interface EmployeeBenefit {
  name: string;
  employee: string;
  benefit_type: string;
  amount: number;
  provider?: string;
  policy_number?: string;
  status: 'Active' | 'Inactive';
}

export interface EmergencyContact {
  name: string;
  employee: string;
  contact_name: string;
  phone: string;
  relation: string;
  is_primary: boolean;
}

export interface EmployeeDocument {
  name: string;
  employee: string;
  document_type: string;
  document_name: string;
  file_url?: string;
  creation?: string;
  owner?: string;
}

export interface FrappeFile {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: boolean;
  creation: string;
  owner: string;
}

export interface EmployeeActivity {
  name: string;
  employee: string;
  activity_type: string;
  date: string;
  description: string;
}

export interface EmployeeFullProfile {
  employee: Employee;
  bank_accounts: EmployeeBankAccount[];
  contracts: EmploymentContract[];
  benefits: EmployeeBenefit[];
  emergency_contacts: EmergencyContact[];
  documents: EmployeeDocument[];
  activities: EmployeeActivity[];
  salary_slips: SalarySlip[];
  leaves: LeaveApplication[];
  attendance_summary: {
    present: number;
    absent: number;
    leave: number;
    wfh: number;
    total: number;
  };
  training_events: TrainingEvent[];
  vacation_balance: number;
}

export interface Company {
  name: string;
  company_name: string;
  abbr: string;
  default_currency: string;
  country: string;
}

export interface Branch {
  name: string;
  branch: string;
}

export interface EmploymentType {
  name: string;
}

export interface Notice {
  name: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  author: string;
  posted_date: string;
  expiry_date?: string;
  target_audience: 'all' | string;
  status: 'Active' | 'Inactive';
}

// ============================================
// LOAN / PRÉSTAMOS (Frappe HR)
// ============================================
export interface Loan {
  name: string;
  applicant: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  rate_of_interest: number;
  disbursement_date?: string;
  repayment_start_date?: string;
  repayment_periods: number;
  monthly_repayment_amount: number;
  total_payment: number;
  total_amount_paid: number;
  status: 'Sanctioned' | 'Disbursed' | 'Partially Disbursed' | 'Repaid' | 'Closed';
  company: string;
  posting_date: string;
}

// ============================================
// TRAVEL REQUEST / VIÁTICOS (Frappe HR)
// ============================================
export interface TravelRequest {
  name: string;
  employee: string;
  employee_name: string;
  travel_type: 'Domestic' | 'International';
  purpose_of_travel: string;
  departure_date: string;
  return_date: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  total_cost?: number;
  company: string;
  description?: string;
}

// ============================================
// EMPLOYEE PROMOTION (Frappe HR)
// ============================================
export interface EmployeePromotion {
  name: string;
  employee: string;
  employee_name: string;
  promotion_date: string;
  promotion_details: { property: string; current: string; new: string }[];
  revised_ctc?: number;
}

// ============================================
// EMPLOYEE TRANSFER (Frappe HR)
// ============================================
export interface EmployeeTransfer {
  name: string;
  employee: string;
  employee_name: string;
  transfer_date: string;
  transfer_details: { property: string; current: string; new: string }[];
}

// ============================================
// EMPLOYEE SEPARATION (Frappe HR)
// ============================================
export interface EmployeeSeparation {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  boarding_status: 'Pending' | 'In Process' | 'Completed';
  resignation_letter_date?: string;
  boarding_begins_on?: string;
  company: string;
}

// ============================================
// SHIFT TYPE / SHIFT ASSIGNMENT (Frappe HR)
// ============================================
export interface ShiftType {
  name: string;
  start_time: string;
  end_time: string;
  holiday_list?: string;
}

export interface ShiftAssignment {
  name: string;
  employee: string;
  employee_name: string;
  shift_type: string;
  start_date: string;
  end_date?: string;
  status: 'Active' | 'Inactive';
  company: string;
}

// ============================================
// EMPLOYEE CHECKIN (Frappe HR)
// ============================================
export interface EmployeeCheckin {
  name: string;
  employee: string;
  employee_name: string;
  time: string;
  device_id?: string;
  log_type: 'IN' | 'OUT';
  shift?: string;
}

// ============================================
// EMPLOYEE GRIEVANCE / QUEJAS (Frappe HR)
// ============================================
export interface EmployeeGrievance {
  name: string;
  subject: string;
  raised_by: string;
  employee: string;
  employee_name: string;
  designation: string;
  department: string;
  date: string;
  grievance_type: string;
  grievance_against_party: string;
  grievance_against: string;
  description: string;
  status: 'Open' | 'Investigated' | 'Resolved' | 'Invalid';
  resolution_date?: string;
  resolution_detail?: string;
}

// ============================================
// EMPLOYEE SKILL MAP / HABILIDADES (Frappe HR)
// ============================================
export interface EmployeeSkillMap {
  name: string;
  employee: string;
  employee_name: string;
  designation: string;
  department: string;
  employee_skills: { skill: string; proficiency: number; evaluation_date?: string }[];
}

// ============================================
// FONDO DE AHORRO (Custom - Note-based)
// ============================================
export interface SavingsFundEntry {
  name: string;
  employee: string;
  employee_name: string;
  entry_type: 'Aportación' | 'Retiro' | 'Rendimiento';
  amount: number;
  date: string;
  notes?: string;
  creation?: string;
}

// ============================================
// PRESTACIONES / BENEFICIOS (Custom - Note-based)
// ============================================
export interface BenefitEntry {
  name: string;
  employee: string;
  employee_name: string;
  benefit_type: 'Aguinaldo' | 'Prima Vacacional' | 'Vales de Despensa' | 'Seguro de Vida' | 'Seguro GMM' | 'Fondo de Ahorro' | 'Bono' | 'Otro';
  amount: number;
  period?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  creation?: string;
}

// ============================================
// INTERVIEW (Frappe HR)
// ============================================
export interface Interview {
  name: string;
  job_applicant: string;
  interview_round: string;
  scheduled_date: string;
  status: 'Pending' | 'Under Review' | 'Cleared' | 'Rejected';
  rating: number;
  average_rating: number;
  interviewer: string;
}

// ============================================
// JOB OFFER (Frappe HR)
// ============================================
export interface JobOffer {
  name: string;
  job_applicant: string;
  applicant_name: string;
  offer_date: string;
  designation: string;
  status: 'Awaiting Response' | 'Accepted' | 'Rejected';
  company: string;
}

// ============================================
// TRAINING PROGRAM (Frappe HR)
// ============================================
export interface TrainingProgram {
  name: string;
  program_name: string;
  trainer_name: string;
  trainer_email: string;
  supplier: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

// ============================================
// TRAINING RESULT (Frappe HR)
// ============================================
export interface TrainingResult {
  name: string;
  employee: string;
  employee_name: string;
  training_event: string;
  hours: number;
  grade: string;
  result: 'Pass' | 'Fail';
  comments: string;
}

// ============================================
// GOAL (Frappe HR)
// ============================================
export interface Goal {
  name: string;
  employee: string;
  employee_name: string;
  goal_name: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  start_date: string;
  end_date: string;
  kra: string;
  per_weightage: number;
  score: number;
}

// ============================================
// ATTENDANCE REQUEST (Frappe HR)
// ============================================
export interface AttendanceRequest {
  name: string;
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  reason: string;
  half_day: boolean;
  status: 'Open' | 'Approved' | 'Rejected';
  explanation: string;
}

// ============================================
// SALARY STRUCTURE (Frappe HR)
// ============================================
export interface SalaryStructure {
  name: string;
  company: string;
  is_active: string;
  payroll_frequency: string;
  salary_slip_based_on_timesheet: boolean;
  docstatus: number;
}

// ============================================
// ADDITIONAL SALARY (Frappe HR)
// ============================================
export interface AdditionalSalary {
  name: string;
  employee: string;
  employee_name: string;
  salary_component: string;
  amount: number;
  payroll_date: string;
  type: 'Earning' | 'Deduction';
  company: string;
}

// ============================================
// EMPLOYEE ADVANCE (Frappe HR)
// ============================================
export interface EmployeeAdvance {
  name: string;
  employee: string;
  employee_name: string;
  purpose: string;
  advance_amount: number;
  paid_amount: number;
  return_amount: number;
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Claimed' | 'Returned' | 'Partly Claimed and Returned' | 'Cancelled';
  posting_date: string;
  company: string;
}

// ============================================
// LEAVE TYPE (Frappe HR)
// ============================================
export interface LeaveType {
  name: string;
  leave_type_name: string;
  max_leaves_allowed: number;
  is_carry_forward: boolean;
  is_earned_leave: boolean;
  allow_negative: boolean;
}

// ============================================
// LEAVE ALLOCATION (Frappe HR)
// ============================================
export interface LeaveAllocation {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  new_leaves_allocated: number;
  total_leaves_allocated: number;
  from_date: string;
  to_date: string;
}

// ============================================
// LEAVE POLICY (Frappe HR)
// ============================================
export interface LeavePolicy {
  name: string;
  leave_policy_details: { leave_type: string; annual_allocation: number }[];
}

// ============================================
// HOLIDAY LIST (Frappe HR)
// ============================================
export interface HolidayList {
  name: string;
  holiday_list_name: string;
  from_date: string;
  to_date: string;
  total_holidays: number;
  country: string;
}

// ============================================
// COMPENSATORY LEAVE REQUEST (Frappe HR)
// ============================================
export interface CompensatoryLeaveRequest {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  work_from_date: string;
  work_end_date: string;
  reason: string;
  status: 'Draft' | 'Approved' | 'Rejected';
}

// ============================================
// LEAVE ENCASHMENT (Frappe HR)
// ============================================
export interface LeaveEncashment {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  encashable_days: number;
  encashment_amount: number;
  leave_period: string;
  currency: string;
}
