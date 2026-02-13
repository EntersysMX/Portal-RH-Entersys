import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, Phone, Building2, FileText, Calendar,
  DollarSign, CalendarCheck, GraduationCap, FolderOpen, Activity,
  Heart, Download, ExternalLink, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PayslipDetailModal from '@/components/payroll/PayslipDetailModal';
import { useEmployeeFullProfile } from '@/hooks/useFrappe';
import { downloadSalarySlipPdf, downloadEmployeeReportPdf } from '@/lib/pdf/pdfGenerator';
import type {
  SalarySlip, LeaveApplication, EmployeeBankAccount,
  EmploymentContract, EmployeeBenefit, EmergencyContact,
  EmployeeDocument, EmployeeActivity, TrainingEvent,
} from '@/types/frappe';

const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'banco', label: 'Info Bancaria', icon: Building2 },
  { id: 'contratos', label: 'Contratos', icon: FileText },
  { id: 'prestaciones', label: 'Prestaciones', icon: Heart },
  { id: 'nomina', label: 'Nómina', icon: DollarSign },
  { id: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { id: 'vacaciones', label: 'Vacaciones', icon: Calendar },
  { id: 'capacitacion', label: 'Capacitación', icon: GraduationCap },
  { id: 'documentos', label: 'Documentos', icon: FolderOpen },
  { id: 'actividades', label: 'Actividades', icon: Activity },
] as const;

type TabId = typeof TABS[number]['id'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const { data: profile, isLoading } = useEmployeeFullProfile(id || '');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">Empleado no encontrado</h3>
        <button onClick={() => navigate('/employees')} className="btn-secondary mt-4">
          Volver a Empleados
        </button>
      </div>
    );
  }

  const emp = profile.employee;
  const slips = profile.salary_slips;
  const lastSlip = slips[0];

  const joinDate = new Date(emp.date_of_joining);
  const now = new Date();
  const years = Math.floor((now.getTime() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(((now.getTime() - joinDate.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
  const tenure = `${years}a ${months}m`;
  const attendPct = profile.attendance_summary.total > 0
    ? Math.round((profile.attendance_summary.present / profile.attendance_summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            {emp.image ? (
              <img src={emp.image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <User className="h-7 w-7" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{emp.employee_name}</h1>
            <p className="text-gray-500">{emp.designation} — {emp.department}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <StatusBadge status={emp.status} />
              <span className="badge badge-info">{emp.name}</span>
              <span className="badge badge-neutral">{emp.employment_type}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => downloadEmployeeReportPdf(emp, slips)}
          className="btn-secondary"
        >
          <Download className="h-4 w-4" />
          Ficha PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Antigüedad" value={tenure} icon={Clock} color="blue" />
        <StatsCard title="Último Neto" value={lastSlip ? formatCurrency(lastSlip.net_pay) : '—'} icon={DollarSign} color="green" />
        <StatsCard title="Asistencia" value={`${attendPct}%`} icon={CalendarCheck} color="purple" />
        <StatsCard title="Vacaciones Disp." value={`${profile.vacation_balance} días`} icon={Calendar} color="orange" />
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <TabGeneral emp={emp} />}
        {activeTab === 'contacto' && <TabContacto emp={emp} contacts={profile.emergency_contacts} />}
        {activeTab === 'banco' && <TabBanco accounts={profile.bank_accounts} />}
        {activeTab === 'contratos' && <TabContratos contracts={profile.contracts} />}
        {activeTab === 'prestaciones' && <TabPrestaciones benefits={profile.benefits} />}
        {activeTab === 'nomina' && <TabNomina slips={slips} onView={setSelectedSlip} />}
        {activeTab === 'asistencia' && <TabAsistencia summary={profile.attendance_summary} />}
        {activeTab === 'vacaciones' && <TabVacaciones leaves={profile.leaves} />}
        {activeTab === 'capacitacion' && <TabCapacitacion trainings={profile.training_events} />}
        {activeTab === 'documentos' && <TabDocumentos docs={profile.documents} />}
        {activeTab === 'actividades' && <TabActividades activities={profile.activities} />}
      </div>

      <PayslipDetailModal slip={selectedSlip} onClose={() => setSelectedSlip(null)} />
    </div>
  );
}

// ============= TAB COMPONENTS =============

function TabGeneral({ emp }: { emp: ReturnType<typeof Object>}) {
  const e = emp as any;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <User className="h-5 w-5 text-gray-400" />
          Datos Personales
        </h3>
        <div className="divide-y divide-gray-100">
          <InfoRow label="Nombre completo" value={e.employee_name} />
          <InfoRow label="Género" value={e.gender} />
          <InfoRow label="Fecha nacimiento" value={e.date_of_birth} icon={<Calendar className="h-4 w-4" />} />
          <InfoRow label="Estado civil" value={e.marital_status} />
          <InfoRow label="Grupo sanguíneo" value={e.blood_group} />
          <InfoRow label="RFC" value={e.rfc} />
          <InfoRow label="CURP" value={e.curp} />
          <InfoRow label="NSS" value={e.nss} />
        </div>
      </div>
      <div className="card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Briefcase className="h-5 w-5 text-gray-400" />
          Datos Laborales
        </h3>
        <div className="divide-y divide-gray-100">
          <InfoRow label="Empresa" value={e.company} icon={<Building2 className="h-4 w-4" />} />
          <InfoRow label="Departamento" value={e.department} />
          <InfoRow label="Puesto" value={e.designation} />
          <InfoRow label="Sucursal" value={e.branch} />
          <InfoRow label="Fecha ingreso" value={e.date_of_joining} icon={<Calendar className="h-4 w-4" />} />
          <InfoRow label="Tipo empleo" value={e.employment_type} />
          <InfoRow label="Reporta a" value={e.reports_to} />
          <InfoRow label="Email corporativo" value={e.company_email} />
        </div>
      </div>
    </div>
  );
}

function TabContacto({ emp, contacts }: { emp: any; contacts: EmergencyContact[] }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Información de Contacto</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoRow label="Teléfono" value={emp.cell_phone} icon={<Phone className="h-4 w-4" />} />
          <InfoRow label="Email personal" value={emp.personal_email} />
          <InfoRow label="Email corporativo" value={emp.company_email} />
          {emp.linkedin_profile && (
            <div className="flex items-start justify-between py-2">
              <span className="text-sm text-gray-500">LinkedIn</span>
              <a href={emp.linkedin_profile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
                Ver perfil <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Direcciones</h3>
        <InfoRow label="Dirección actual" value={emp.current_address} />
        <InfoRow label="Dirección permanente" value={emp.permanent_address} />
      </div>
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Contactos de Emergencia</h3>
        {contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="pb-2 text-left font-medium text-gray-500">Nombre</th><th className="pb-2 text-left font-medium text-gray-500">Teléfono</th><th className="pb-2 text-left font-medium text-gray-500">Relación</th><th className="pb-2 text-left font-medium text-gray-500">Principal</th></tr></thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{c.contact_name}</td>
                    <td className="py-2 text-gray-600">{c.phone}</td>
                    <td className="py-2 text-gray-600">{c.relation}</td>
                    <td className="py-2">{c.is_primary ? <span className="badge badge-success">Sí</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin contactos de emergencia registrados</p>
        )}
      </div>
    </div>
  );
}

function TabBanco({ accounts }: { accounts: EmployeeBankAccount[] }) {
  const cols: Column<EmployeeBankAccount>[] = [
    { key: 'bank_name', header: 'Banco' },
    { key: 'bank_account_no', header: 'Número de Cuenta' },
    { key: 'clabe', header: 'CLABE', render: (a) => <span>{a.clabe || '—'}</span> },
    { key: 'currency', header: 'Moneda', render: (a) => <span>{a.currency || 'MXN'}</span> },
    { key: 'is_default', header: 'Principal', render: (a) => a.is_default ? <span className="badge badge-success">Sí</span> : <span>—</span> },
  ];
  return (
    <DataTable
      columns={cols}
      data={accounts}
      emptyMessage="Sin cuentas bancarias registradas"
    />
  );
}

function TabContratos({ contracts }: { contracts: EmploymentContract[] }) {
  return (
    <div className="space-y-4">
      {contracts.length === 0 && <p className="card p-6 text-center text-gray-400">Sin contratos registrados</p>}
      {contracts.map((c) => (
        <div key={c.name} className={clsx('card p-5', c.status === 'Active' && 'border-l-4 border-l-green-500')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{c.contract_type}</p>
              <p className="text-sm text-gray-500">
                {c.start_date} — {c.end_date || 'Vigente'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(c.salary)}</p>
              <StatusBadge status={c.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabPrestaciones({ benefits }: { benefits: EmployeeBenefit[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {benefits.length === 0 && <p className="col-span-full card p-6 text-center text-gray-400">Sin prestaciones registradas</p>}
      {benefits.map((b) => (
        <div key={b.name} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{b.benefit_type}</p>
              <p className="text-sm text-gray-500">{b.provider || 'Sin proveedor'}</p>
              {b.policy_number && <p className="text-xs text-gray-400">Póliza: {b.policy_number}</p>}
            </div>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">{formatCurrency(b.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function TabNomina({ slips, onView }: { slips: SalarySlip[]; onView: (s: SalarySlip) => void }) {
  const chartData = slips.slice().reverse().map((s) => ({
    periodo: s.start_date.substring(5),
    neto: s.net_pay,
  }));

  const cols: Column<SalarySlip>[] = [
    { key: 'start_date', header: 'Período', render: (s) => <span>{s.start_date} — {s.end_date}</span> },
    { key: 'gross_pay', header: 'Bruto', render: (s) => <span className="font-medium">{formatCurrency(s.gross_pay)}</span> },
    { key: 'total_deduction', header: 'Deducciones', render: (s) => <span className="text-red-600">{formatCurrency(s.total_deduction)}</span> },
    { key: 'net_pay', header: 'Neto', render: (s) => <span className="font-bold text-green-600">{formatCurrency(s.net_pay)}</span> },
    { key: 'status', header: 'Estado', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions', header: 'Acciones', render: (s) => (
        <div className="flex gap-1">
          <button onClick={() => onView(s)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Ver detalle">
            <FileText className="h-4 w-4" />
          </button>
          <button onClick={() => downloadSalarySlipPdf(s)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Descargar PDF">
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {chartData.length > 2 && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Evolución Neto a Pagar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="neto" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <DataTable columns={cols} data={slips} emptyMessage="Sin recibos de nómina" />
    </div>
  );
}

function TabAsistencia({ summary }: { summary: { present: number; absent: number; leave: number; wfh: number; total: number } }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Presente" value={summary.present} icon={CalendarCheck} color="green" />
      <StatsCard title="Ausente" value={summary.absent} icon={CalendarCheck} color="red" />
      <StatsCard title="Permiso" value={summary.leave} icon={Calendar} color="orange" />
      <StatsCard title="Home Office" value={summary.wfh} icon={Building2} color="cyan" />
    </div>
  );
}

function TabVacaciones({ leaves }: { leaves: LeaveApplication[] }) {
  const cols: Column<LeaveApplication>[] = [
    { key: 'leave_type', header: 'Tipo' },
    { key: 'from_date', header: 'Desde' },
    { key: 'to_date', header: 'Hasta' },
    { key: 'total_leave_days', header: 'Días', render: (l) => <span className="font-medium">{l.total_leave_days}</span> },
    { key: 'status', header: 'Estado', render: (l) => <StatusBadge status={l.status} /> },
    { key: 'leave_approver', header: 'Aprobador' },
  ];
  return <DataTable columns={cols} data={leaves} emptyMessage="Sin solicitudes de vacaciones" />;
}

function TabCapacitacion({ trainings }: { trainings: TrainingEvent[] }) {
  return (
    <div className="space-y-4">
      {trainings.length === 0 && <p className="card p-6 text-center text-gray-400">Sin capacitaciones registradas</p>}
      {trainings.map((t) => (
        <div key={t.name} className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{t.event_name}</p>
              <p className="text-sm text-gray-500">{t.type} — {t.level}</p>
              <p className="text-xs text-gray-400">{t.start_time} — {t.end_time}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={t.status} />
              {t.trainer_name && <p className="mt-1 text-xs text-gray-400">Instructor: {t.trainer_name}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabDocumentos({ docs }: { docs: EmployeeDocument[] }) {
  return (
    <div className="space-y-3">
      {docs.length === 0 && <p className="card p-6 text-center text-gray-400">Sin documentos registrados</p>}
      {docs.map((d) => (
        <div key={d.name} className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{d.document_name}</p>
              <p className="text-xs text-gray-400">{d.document_type}</p>
            </div>
          </div>
          {d.file_url && (
            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
              <Download className="h-4 w-4" /> Descargar
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function TabActividades({ activities }: { activities: EmployeeActivity[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-0 h-full w-0.5 bg-gray-200" />
      {activities.length === 0 && <p className="card p-6 text-center text-gray-400">Sin actividades registradas</p>}
      {activities.map((a, idx) => (
        <div key={a.name} className="relative mb-6 pl-6">
          <div className={clsx(
            'absolute -left-3.5 top-1 h-3 w-3 rounded-full border-2 border-white',
            idx === 0 ? 'bg-primary-600' : 'bg-gray-400'
          )} />
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <span className="badge badge-info">{a.activity_type}</span>
              <span className="text-xs text-gray-400">{a.date}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{a.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
