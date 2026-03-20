/**
 * Demo Data Seeder & Cleaner
 *
 * Creates realistic demo records across ALL modules using Frappe API.
 * Employee reference: Cynthia Monares Tellez, 33 years old.
 * Stores a tracker in a Frappe Note so all data can be cleaned up later.
 */
import {
  frappeCreateDoc,
  frappeDeleteDoc,
  frappeUpdateDoc,
} from '@/api/client';
import {
  companyService,
  catalogService,
  employeeService,
  leaveService,
  leaveAllocationService,
  recruitmentService,
  interviewService,
  jobOfferService,
  performanceService,
  goalService,
  trainingService,
  trainingProgramService,
  trainingResultService,
  loanService,
  additionalSalaryService,
  employeeAdvanceService,
  attendanceRequestService,
  movementsService,
  grievanceService,
  skillMapService,
  travelService,
  expenseService,
  shiftService,
  surveyService,
  incapacityService,
  disciplineService,
  equipmentService,
  onboardingService,
  savingsFundService,
  benefitsService,
  platformConfigService,
} from '@/api/services';

// ============================================
// TYPES
// ============================================

interface DemoRecord {
  doctype: string;
  name: string;
  store: 'frappe' | 'note';
  noteService?: string;
}

export interface DemoTracker {
  records: DemoRecord[];
  employeeId: string;
  employeeName: string;
  company: string;
  createdAt: string;
}

export type ProgressCallback = (step: string, success: boolean, detail?: string) => void;

const TRACKER_KEY = 'demo_tracker';

// ============================================
// TRACKER PERSISTENCE
// ============================================

export async function loadDemoTracker(): Promise<DemoTracker | null> {
  return platformConfigService.loadConfig<DemoTracker | null>(TRACKER_KEY, null);
}

async function saveTracker(tracker: DemoTracker): Promise<void> {
  await platformConfigService.saveConfig(TRACKER_KEY, tracker);
}

async function clearTracker(): Promise<void> {
  await platformConfigService.saveConfig(TRACKER_KEY, null);
}

// ============================================
// HELPERS
// ============================================

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

/** Try an async operation, return result or null on error */
async function tryOp<T>(
  fn: () => Promise<T>,
  onProgress: ProgressCallback,
  label: string,
): Promise<T | null> {
  try {
    const result = await fn();
    onProgress(label, true);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onProgress(label, false, msg);
    return null;
  }
}

// ============================================
// SEEDER
// ============================================

export async function seedDemoData(onProgress: ProgressCallback): Promise<DemoTracker> {
  const tracker: DemoTracker = {
    records: [],
    employeeId: '',
    employeeName: 'Cynthia Monares Tellez',
    company: '',
    createdAt: new Date().toISOString(),
  };

  const track = (doctype: string, name: string, store: 'frappe' | 'note' = 'frappe', noteService?: string) => {
    tracker.records.push({ doctype, name, store, noteService });
  };

  // ─── 1. COMPANY ───────────────────────────────────────
  onProgress('Verificando empresa...', true);
  let company = '';
  try {
    const companies = await companyService.list();
    if (companies.length > 0) {
      company = companies[0].name;
      onProgress(`Empresa existente: ${company}`, true);
    } else {
      const newCo = await frappeCreateDoc<Record<string, unknown>>('Company', {
        company_name: 'Entersys',
        default_currency: 'MXN',
        country: 'Mexico',
        abbr: 'ENT',
      });
      company = newCo.name as string;
      track('Company', company);
      onProgress(`Empresa creada: ${company}`, true);
    }
  } catch (err) {
    company = 'Entersys';
    onProgress('Empresa: usando nombre por defecto', false, String(err));
  }
  tracker.company = company;

  // ─── 2. DEPARTMENT & DESIGNATION ──────────────────────
  await tryOp(
    () => catalogService.ensureExists('Department', { department_name: 'Tecnología', company }),
    onProgress,
    'Departamento: Tecnología',
  );

  await tryOp(
    () => catalogService.ensureExists('Designation', { designation: 'Desarrolladora Full Stack' }),
    onProgress,
    'Puesto: Desarrolladora Full Stack',
  );

  // ─── 3. EMPLOYEE ──────────────────────────────────────
  const emp = await tryOp(
    () => employeeService.create({
      first_name: 'Cynthia',
      last_name: 'Monares Tellez',
      employee_name: 'Cynthia Monares Tellez',
      gender: 'Female',
      date_of_birth: '1993-03-15',
      date_of_joining: '2023-01-15',
      company,
      department: 'Tecnología',
      designation: 'Desarrolladora Full Stack',
      status: 'Active',
      cell_phone: '+52 55 1234 5678',
      personal_email: 'cynthia.monares@email.com',
      company_email: 'cmonares@entersys.com',
    } as Record<string, unknown>),
    onProgress,
    'Empleada: Cynthia Monares Tellez',
  );

  if (!emp) {
    onProgress('ERROR: No se pudo crear empleada. Abortando.', false);
    await saveTracker(tracker);
    return tracker;
  }

  const empId = emp.name;
  tracker.employeeId = empId;
  track('Employee', empId);

  // ─── 4. ATTENDANCE (5 records) ────────────────────────
  for (let i = 1; i <= 5; i++) {
    const date = daysAgo(i);
    const status = i === 3 ? 'Work From Home' : i === 5 ? 'Absent' : 'Present';
    const att = await tryOp(
      () => frappeCreateDoc<Record<string, unknown>>('Attendance', {
        employee: empId,
        attendance_date: date,
        status,
        company,
      }),
      onProgress,
      `Asistencia ${date}: ${status}`,
    );
    if (att) track('Attendance', att.name as string);
  }

  // ─── 5. ATTENDANCE REQUEST ────────────────────────────
  const attReq = await tryOp(
    () => attendanceRequestService.create({
      employee: empId,
      from_date: daysFromNow(2),
      to_date: daysFromNow(2),
      reason: 'Work From Home',
      explanation: 'Cita médica por la tarde, trabajo remoto',
      half_day: false,
    } as Record<string, unknown>),
    onProgress,
    'Solicitud de asistencia',
  );
  if (attReq) track('Attendance Request', attReq.name);

  // ─── 6. LEAVE ALLOCATION ──────────────────────────────
  const leaveAlloc = await tryOp(
    () => leaveAllocationService.create({
      employee: empId,
      leave_type: 'Casual Leave',
      new_leaves_allocated: 15,
      from_date: `${new Date().getFullYear()}-01-01`,
      to_date: `${new Date().getFullYear()}-12-31`,
      company,
    } as Record<string, unknown>),
    onProgress,
    'Asignación de vacaciones: 15 días',
  );
  if (leaveAlloc) track('Leave Allocation', leaveAlloc.name);

  // ─── 7. LEAVE APPLICATION ─────────────────────────────
  const leave = await tryOp(
    () => leaveService.create({
      employee: empId,
      leave_type: 'Casual Leave',
      from_date: daysFromNow(10),
      to_date: daysFromNow(12),
      total_leave_days: 3,
      status: 'Open',
      posting_date: today(),
      company,
    } as Record<string, unknown>),
    onProgress,
    'Solicitud de vacaciones: 3 días',
  );
  if (leave) track('Leave Application', leave.name);

  // ─── 8. JOB OPENING ──────────────────────────────────
  const opening = await tryOp(
    () => recruitmentService.createOpening({
      job_title: 'Analista de Datos',
      designation: 'Desarrolladora Full Stack',
      company,
      status: 'Open',
      description: 'Buscamos analista de datos con experiencia en Python y SQL',
    } as Record<string, unknown>),
    onProgress,
    'Vacante: Analista de Datos',
  );
  if (opening) track('Job Opening', opening.name);

  // ─── 9. JOB APPLICANT ────────────────────────────────
  const applicant = await tryOp(
    () => recruitmentService.createApplicant({
      applicant_name: 'Carlos Hernández López',
      email_id: 'carlos.hernandez@gmail.com',
      job_title: opening?.name || 'Analista de Datos',
      status: 'Open',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Candidato: Carlos Hernández López',
  );
  if (applicant) track('Job Applicant', applicant.name);

  // ─── 10. INTERVIEW ────────────────────────────────────
  const interview = await tryOp(
    () => interviewService.create({
      job_applicant: applicant?.name || '',
      interview_round: 'Entrevista Técnica',
      scheduled_date: daysFromNow(5),
      status: 'Pending',
      interviewer: empId,
    } as Record<string, unknown>),
    onProgress,
    'Entrevista programada',
  );
  if (interview) track('Interview', interview.name);

  // ─── 11. JOB OFFER ───────────────────────────────────
  const offer = await tryOp(
    () => jobOfferService.create({
      job_applicant: applicant?.name || '',
      applicant_name: 'Carlos Hernández López',
      offer_date: today(),
      designation: 'Analista de Datos',
      status: 'Awaiting Response',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Oferta de trabajo',
  );
  if (offer) track('Job Offer', offer.name);

  // ─── 12. APPRAISAL ───────────────────────────────────
  const appraisal = await tryOp(
    () => performanceService.create({
      employee: empId,
      start_date: monthsAgo(6),
      end_date: today(),
      status: 'Completed',
      final_score: 4.2,
      company,
      goals: [
        { kra: 'Desarrollo de Software', per_weightage: 40, score: 4.5 },
        { kra: 'Trabajo en Equipo', per_weightage: 25, score: 4.0 },
        { kra: 'Innovación', per_weightage: 20, score: 4.2 },
        { kra: 'Comunicación', per_weightage: 15, score: 3.8 },
      ],
    } as Record<string, unknown>),
    onProgress,
    'Evaluación de desempeño (4.2/5)',
  );
  if (appraisal) track('Appraisal', appraisal.name);

  // ─── 13. GOALS ────────────────────────────────────────
  const goal1 = await tryOp(
    () => goalService.create({
      employee: empId,
      goal_name: 'Migrar sistema legacy a React',
      kra: 'Desarrollo de Software',
      per_weightage: 40,
      status: 'Completed',
      score: 5,
      start_date: monthsAgo(6),
      end_date: monthsAgo(1),
    } as Record<string, unknown>),
    onProgress,
    'Objetivo: Migrar a React (completado)',
  );
  if (goal1) track('Goal', goal1.name);

  const goal2 = await tryOp(
    () => goalService.create({
      employee: empId,
      goal_name: 'Implementar CI/CD pipeline',
      kra: 'Innovación',
      per_weightage: 30,
      status: 'In Progress',
      score: 3,
      start_date: monthsAgo(2),
      end_date: daysFromNow(30),
    } as Record<string, unknown>),
    onProgress,
    'Objetivo: CI/CD pipeline (en progreso)',
  );
  if (goal2) track('Goal', goal2.name);

  // ─── 14. TRAINING EVENT ───────────────────────────────
  const training = await tryOp(
    () => trainingService.create({
      event_name: 'Workshop: Arquitectura de Microservicios',
      type: 'Workshop',
      level: 'Intermediate',
      status: 'Completed',
      start_time: `${monthsAgo(2)} 09:00:00`,
      end_time: `${monthsAgo(2)} 17:00:00`,
      trainer_name: 'Dr. Roberto García',
      company,
      employees: [{ employee: empId, employee_name: 'Cynthia Monares Tellez' }],
    } as Record<string, unknown>),
    onProgress,
    'Capacitación: Microservicios',
  );
  if (training) track('Training Event', training.name);

  // ─── 15. TRAINING PROGRAM ─────────────────────────────
  const tProgram = await tryOp(
    () => trainingProgramService.create({
      name: 'Certificación Cloud AWS',
      trainer_name: 'AWS Academy',
      supplier: 'Amazon Web Services',
      status: 'Scheduled',
    } as Record<string, unknown>),
    onProgress,
    'Programa: Certificación AWS',
  );
  if (tProgram) track('Training Program', tProgram.name);

  // ─── 16. TRAINING RESULT ──────────────────────────────
  if (training) {
    const tResult = await tryOp(
      () => trainingResultService.create({
        employee: empId,
        employee_name: 'Cynthia Monares Tellez',
        training_event: training.name,
        hours: 8,
        grade: 'A',
        result: 'Pass',
        comments: 'Excelente participación y proyecto final destacado',
      } as Record<string, unknown>),
      onProgress,
      'Resultado capacitación: Aprobado (A)',
    );
    if (tResult) track('Training Result', tResult.name);
  }

  // ─── 17. LOAN ─────────────────────────────────────────
  const loan = await tryOp(
    () => loanService.create({
      applicant: empId,
      applicant_name: 'Cynthia Monares Tellez',
      loan_type: 'Personal',
      loan_amount: 50000,
      rate_of_interest: 12,
      repayment_periods: 12,
      monthly_repayment_amount: 4440,
      status: 'Sanctioned',
      posting_date: monthsAgo(3),
      disbursement_date: monthsAgo(3),
      repayment_start_date: monthsAgo(2),
      company,
      total_payment: 0,
      total_amount_paid: 8880,
    } as Record<string, unknown>),
    onProgress,
    'Préstamo personal: $50,000',
  );
  if (loan) track('Loan', loan.name);

  // ─── 18. EMPLOYEE ADVANCE ─────────────────────────────
  const advance = await tryOp(
    () => employeeAdvanceService.create({
      employee: empId,
      purpose: 'Viáticos conferencia GDL',
      advance_amount: 8000,
      paid_amount: 8000,
      return_amount: 1200,
      status: 'Paid',
      posting_date: monthsAgo(1),
      company,
    } as Record<string, unknown>),
    onProgress,
    'Anticipo: $8,000 viáticos',
  );
  if (advance) track('Employee Advance', advance.name);

  // ─── 19. ADDITIONAL SALARY ────────────────────────────
  const bonus = await tryOp(
    () => additionalSalaryService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      salary_component: 'Bono por Desempeño',
      amount: 15000,
      payroll_date: monthsAgo(1),
      type: 'Earning',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Bono por desempeño: $15,000',
  );
  if (bonus) track('Additional Salary', bonus.name);

  // ─── 20. EMPLOYEE PROMOTION ───────────────────────────
  const promo = await tryOp(
    () => movementsService.createPromotion({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      promotion_date: monthsAgo(6),
      new_designation: 'Desarrolladora Full Stack',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Promoción a Full Stack',
  );
  if (promo) track('Employee Promotion', promo.name);

  // ─── 21. SHIFT ASSIGNMENT ─────────────────────────────
  const shift = await tryOp(
    () => shiftService.createAssignment({
      employee: empId,
      shift_type: 'Turno Matutino',
      start_date: monthsAgo(1),
      end_date: daysFromNow(30),
      company,
    } as Record<string, unknown>),
    onProgress,
    'Asignación turno matutino',
  );
  if (shift) track('Shift Assignment', shift.name);

  // ─── 22. EMPLOYEE GRIEVANCE ───────────────────────────
  const grievance = await tryOp(
    () => grievanceService.create({
      subject: 'Solicitud de mejora en área de descanso',
      raised_by: empId,
      grievance_against: 'Administración',
      date: monthsAgo(2),
      description: 'El área de descanso necesita mejor ventilación y mobiliario ergonómico.',
      status: 'Resolved',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Queja: Mejora área de descanso (resuelta)',
  );
  if (grievance) track('Employee Grievance', grievance.name);

  // ─── 23. SKILL MAP ────────────────────────────────────
  const skillMap = await tryOp(
    () => skillMapService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      employee_skills: [
        { skill: 'React', rating: 1, evaluation_date: today() },
        { skill: 'TypeScript', rating: 0.9, evaluation_date: today() },
        { skill: 'Node.js', rating: 0.85, evaluation_date: today() },
        { skill: 'Python', rating: 0.7, evaluation_date: today() },
        { skill: 'SQL', rating: 0.8, evaluation_date: today() },
        { skill: 'Docker', rating: 0.75, evaluation_date: today() },
      ],
    } as Record<string, unknown>),
    onProgress,
    'Mapa de habilidades (6 skills)',
  );
  if (skillMap) track('Employee Skill Map', skillMap.name);

  // ─── 24. TRAVEL REQUEST ───────────────────────────────
  const travel = await tryOp(
    () => travelService.create({
      employee: empId,
      travel_type: 'Business',
      purpose_of_travel: 'Conferencia Tech Summit 2024 - Guadalajara',
      travel_from: 'Ciudad de México',
      travel_to: 'Guadalajara',
      departure_date: daysFromNow(15),
      return_date: daysFromNow(18),
      status: 'Draft',
      company,
    } as Record<string, unknown>),
    onProgress,
    'Solicitud viaje: Tech Summit GDL',
  );
  if (travel) track('Travel Request', travel.name);

  // ─── 25. EXPENSE CLAIM ────────────────────────────────
  const expense = await tryOp(
    () => expenseService.create({
      employee: empId,
      expense_type: 'Travel',
      posting_date: monthsAgo(1),
      company,
      expenses: [
        { expense_date: monthsAgo(1), expense_type: 'Travel', description: 'Vuelo CDMX-GDL ida y vuelta', amount: 3500 },
        { expense_date: monthsAgo(1), expense_type: 'Food', description: 'Comidas durante conferencia', amount: 1200 },
      ],
    } as Record<string, unknown>),
    onProgress,
    'Gasto: Viaje conferencia $4,700',
  );
  if (expense) track('Expense Claim', expense.name);

  // ═══════════════════════════════════════════
  // NOTE-BASED MODULES (custom stores)
  // ═══════════════════════════════════════════

  // ─── 26. SURVEY ───────────────────────────────────────
  const survey = await tryOp(
    () => surveyService.create({
      title: 'Encuesta de Satisfacción Laboral Q1 2024',
      description: 'Evaluación trimestral del clima organizacional',
      status: 'Active',
      is_anonymous: true,
      start_date: monthsAgo(1),
      end_date: daysFromNow(15),
      questions: [
        { id: 'q1', text: '¿Qué tan satisfecho estás con tu trabajo?', type: 'rating', required: true },
        { id: 'q2', text: '¿Recomendarías Entersys como empleador?', type: 'yes_no', required: true },
        { id: 'q3', text: 'Comentarios adicionales', type: 'text', required: false },
      ],
      responses_count: 0,
    } as Record<string, unknown>),
    onProgress,
    'Encuesta: Satisfacción Laboral Q1',
  );
  if (survey) track('Survey', survey.name, 'note', 'surveyService');

  // ─── 27. INCAPACITY ───────────────────────────────────
  const incapacity = await tryOp(
    () => incapacityService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      type: 'Enfermedad General',
      start_date: monthsAgo(4),
      end_date: daysAgo(25 + 30 * 3),
      days: 3,
      folio: 'IMSS-2024-001234',
      institution: 'IMSS',
      status: 'Cerrada',
      notes: 'Infección respiratoria leve. Alta sin complicaciones.',
    } as Record<string, unknown>),
    onProgress,
    'Incapacidad: 3 días (resuelta)',
  );
  if (incapacity) track('Incapacity', incapacity.name, 'note', 'incapacityService');

  // ─── 28. DISCIPLINARY ACTION ──────────────────────────
  const discipline = await tryOp(
    () => disciplineService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      action_type: 'Amonestación Verbal',
      date: monthsAgo(8),
      reason: 'Llegada tarde reiterada (3 veces en un mes)',
      description: 'Se conversó con la empleada y se acordó mejorar puntualidad.',
      status: 'Cerrada',
      resolved_date: monthsAgo(7),
    } as Record<string, unknown>),
    onProgress,
    'Acción disciplinaria: Amonestación verbal (resuelta)',
  );
  if (discipline) track('DisciplinaryAction', discipline.name, 'note', 'disciplineService');

  // ─── 29. EQUIPMENT ────────────────────────────────────
  const equip = await tryOp(
    () => equipmentService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      equipment_type: 'Laptop',
      equipment_name: 'MacBook Pro 14" M3',
      serial_number: 'MBP-2024-CMT-001',
      assigned_date: '2023-01-15',
      status: 'Asignado',
      condition: 'Bueno',
      notes: 'Equipo de trabajo principal',
    } as Record<string, unknown>),
    onProgress,
    'Equipo: MacBook Pro 14" M3',
  );
  if (equip) track('EquipmentAssignment', equip.name, 'note', 'equipmentService');

  // ─── 30. ONBOARDING ───────────────────────────────────
  const onboard = await tryOp(
    () => onboardingService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      department: 'Tecnología',
      start_date: '2023-01-15',
      status: 'Completado',
      items: [
        { task: 'Firma de contrato', completed: true, completed_date: '2023-01-15' },
        { task: 'Alta en IMSS', completed: true, completed_date: '2023-01-16' },
        { task: 'Entrega de equipo', completed: true, completed_date: '2023-01-15' },
        { task: 'Inducción de seguridad', completed: true, completed_date: '2023-01-17' },
        { task: 'Tour de oficinas', completed: true, completed_date: '2023-01-15' },
        { task: 'Configuración de cuentas', completed: true, completed_date: '2023-01-16' },
      ],
      progress: 100,
    } as Record<string, unknown>),
    onProgress,
    'Onboarding completado (6/6 tareas)',
  );
  if (onboard) track('OnboardingChecklist', onboard.name, 'note', 'onboardingService');

  // ─── 31. SAVINGS FUND ─────────────────────────────────
  for (let i = 1; i <= 3; i++) {
    const sf = await tryOp(
      () => savingsFundService.create({
        employee: empId,
        employee_name: 'Cynthia Monares Tellez',
        period: monthsAgo(i),
        employee_contribution: 2500,
        company_contribution: 2500,
        total: 5000,
        type: 'Aportación',
        status: 'Aplicado',
      } as Record<string, unknown>),
      onProgress,
      `Fondo ahorro: Mes -${i} ($5,000)`,
    );
    if (sf) track('SavingsFundEntry', sf.name, 'note', 'savingsFundService');
  }

  // ─── 32. BENEFITS ─────────────────────────────────────
  const benefit = await tryOp(
    () => benefitsService.create({
      employee: empId,
      employee_name: 'Cynthia Monares Tellez',
      benefit_type: 'Seguro de Gastos Médicos Mayores',
      provider: 'GNP Seguros',
      start_date: '2023-01-15',
      end_date: '2024-12-31',
      coverage_amount: 500000,
      employee_cost: 0,
      company_cost: 8500,
      status: 'Activo',
      notes: 'Póliza corporativa, cobertura familiar',
    } as Record<string, unknown>),
    onProgress,
    'Prestación: Seguro GMM (GNP)',
  );
  if (benefit) track('BenefitEntry', benefit.name, 'note', 'benefitsService');

  // ─── SAVE TRACKER ─────────────────────────────────────
  await saveTracker(tracker);
  onProgress(`Datos demo creados: ${tracker.records.length} registros`, true);

  return tracker;
}

// ============================================
// CLEANER
// ============================================

/** Map of note service names to their delete functions */
const noteServiceMap: Record<string, { delete: (name: string) => Promise<void> }> = {
  surveyService,
  incapacityService,
  disciplineService,
  equipmentService,
  onboardingService,
  savingsFundService,
  benefitsService,
};

export async function cleanDemoData(onProgress: ProgressCallback): Promise<void> {
  const tracker = await loadDemoTracker();
  if (!tracker || tracker.records.length === 0) {
    onProgress('No hay datos demo para limpiar', true);
    return;
  }

  // Delete in reverse order (children first, then parents)
  const reversed = [...tracker.records].reverse();
  let deleted = 0;
  let failed = 0;

  for (const rec of reversed) {
    try {
      if (rec.store === 'note' && rec.noteService) {
        const svc = noteServiceMap[rec.noteService];
        if (svc) {
          await svc.delete(rec.name);
        }
      } else {
        // Frappe doctype — try direct delete
        try {
          await frappeDeleteDoc(rec.doctype, rec.name);
        } catch {
          // If delete fails, try cancel + delete (for submitted docs)
          try {
            await frappeUpdateDoc(rec.doctype, rec.name, { docstatus: 2 });
            await frappeDeleteDoc(rec.doctype, rec.name);
          } catch {
            // Last resort: try amend cancel
            throw new Error(`No se pudo eliminar ${rec.doctype}/${rec.name}`);
          }
        }
      }
      deleted++;
      onProgress(`Eliminado: ${rec.doctype} / ${rec.name}`, true);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`Error al eliminar ${rec.doctype} / ${rec.name}`, false, msg);
    }
  }

  // Clear tracker
  await clearTracker();
  onProgress(`Limpieza completada: ${deleted} eliminados, ${failed} errores`, true);
}
