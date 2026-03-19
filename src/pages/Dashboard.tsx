import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Briefcase,
  CalendarCheck,
  Clock,
  TrendingUp,
  DollarSign,
  Calculator,
  TrendingDown,
  GraduationCap,
  Download,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import { useDashboardStats, useNotices, useSalarySlips } from '@/hooks/useFrappe';
import { downloadPayrollSummaryPdf } from '@/lib/pdf/pdfGenerator';
import { toast } from '@/components/ui/Toast';
import { clsx } from 'clsx';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const NOTICE_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  urgent: AlertCircle,
};

const NOTICE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-yellow-100 text-yellow-600',
  success: 'bg-green-100 text-green-600',
  urgent: 'bg-red-100 text-red-600',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: notices } = useNotices(3);
  const { data: slips } = useSalarySlips();

  const recentNotices = (notices || []).slice(0, 3);

  const deptData = (stats?.department_distribution || []).map((d) => ({
    name: d.department,
    value: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-5 shadow-md">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-primary-200">
          Resumen general de Recursos Humanos
        </p>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Empleados"
          value={stats?.total_employees ?? 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Empleados Activos"
          value={stats?.active_employees ?? 0}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Nuevas Contrataciones"
          value={stats?.new_hires_this_month ?? 0}
          icon={UserPlus}
          color="purple"
        />
        <StatsCard
          title="Vacantes Abiertas"
          value={stats?.open_positions ?? 0}
          icon={Briefcase}
          color="orange"
        />
        <StatsCard
          title="Permisos Pendientes"
          value={stats?.pending_leaves ?? 0}
          icon={Clock}
          color="red"
        />
        <StatsCard
          title="Asistencia Hoy"
          value={stats?.attendance_today ?? 0}
          icon={CalendarCheck}
          color="cyan"
        />
      </div>

      {/* Stats Cards - Row 2: Financial KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Costo Mensual Nómina"
          value={formatCurrency(stats?.monthly_payroll_cost ?? 0)}
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Costo Promedio/Empleado"
          value={formatCurrency(stats?.avg_cost_per_employee ?? 0)}
          icon={Calculator}
          color="cyan"
        />
        <StatsCard
          title="Tasa de Rotación"
          value={`${stats?.turnover_rate ?? 0}%`}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="Capacitaciones Activas"
          value={stats?.active_trainings ?? 0}
          icon={GraduationCap}
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hiring Trends */}
        <div className="card border-t-[3px] border-t-blue-500">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Tendencia de Contrataciones
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.monthly_hiring || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="contrataciones" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="bajas" fill="#f87171" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="card border-t-[3px] border-t-emerald-500">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Distribución por Departamento
          </h3>
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
            <ResponsiveContainer width="100%" height={280} className="lg:!w-1/2">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {deptData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:space-y-2 lg:gap-0">
              {deptData.map((dept, idx) => (
                <div key={dept.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{dept.name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {dept.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Notices + Quick Actions Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Notices */}
        <div className="card border-t-[3px] border-t-amber-500">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Avisos Recientes</h3>
            <button onClick={() => navigate('/notices')} className="text-sm font-medium text-primary-600 hover:underline">
              Ver todos
            </button>
          </div>
          {recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((notice) => {
                const Icon = NOTICE_ICONS[notice.type] || Info;
                return (
                  <div key={notice.name} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                    <div className={clsx('rounded-lg p-1.5', NOTICE_COLORS[notice.type] || 'bg-gray-100 text-gray-600')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{notice.posted_date} · {notice.author}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No hay avisos recientes</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="card border-t-[3px] border-t-violet-500">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Nuevo Empleado', href: '/employees?action=new', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Nueva Vacante', href: '/recruitment?action=new', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { label: 'Registrar Asistencia', href: '/attendance', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { label: 'Procesar Nómina', href: '/payroll', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition-colors ${action.color}`}
              >
                {action.label}
              </a>
            ))}
            <button
              onClick={() => {
                try {
                  if (slips) downloadPayrollSummaryPdf(slips);
                } catch (err) {
                  toast.fromError(err);
                }
              }}
              disabled={!slips || slips.length === 0}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Descargar Resumen Nómina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
