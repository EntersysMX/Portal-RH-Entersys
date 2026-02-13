import { CalendarCheck, DollarSign, GraduationCap, Clock, FileText, TrendingUp, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import { useAuthStore } from '@/store/authStore';
import { useMySalarySlips, useMyAttendance, useMyLeaves, useNotices } from '@/hooks/useFrappe';

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

export default function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: salarySlips } = useMySalarySlips(5);
  const { data: attendance } = useMyAttendance(undefined, 30);
  const { data: leaves } = useMyLeaves(undefined, 10);
  const { data: notices } = useNotices(3);

  // Calcular stats
  const lastSlip = salarySlips?.[0];
  const presentDays = attendance?.filter((a) => a.status === 'Present').length ?? 0;
  const totalAttendance = attendance?.length ?? 0;
  const pendingLeaves = leaves?.filter((l) => l.status === 'Open').length ?? 0;
  const approvedLeaves = leaves?.filter((l) => l.status === 'Approved').length ?? 0;
  const recentNotices = (notices || []).filter((n) => n.status === 'Active').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.employee_name || user?.full_name || 'Empleado'}
        </h1>
        <p className="mt-1 text-gray-500">
          Portal de empleado &mdash; {user?.employee_id || 'Sin ID asignado'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Último Recibo"
          value={lastSlip ? `$${lastSlip.net_pay?.toLocaleString('es-MX')}` : 'Sin datos'}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Asistencia (mes)"
          value={totalAttendance > 0 ? `${presentDays}/${totalAttendance}` : 'Sin datos'}
          icon={CalendarCheck}
          color="blue"
        />
        <StatsCard
          title="Permisos Pendientes"
          value={String(pendingLeaves)}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Permisos Aprobados"
          value={String(approvedLeaves)}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Últimos recibos */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Últimos Recibos</h3>
          </div>
          {salarySlips && salarySlips.length > 0 ? (
            <div className="space-y-3">
              {salarySlips.slice(0, 3).map((slip) => (
                <div key={slip.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {slip.start_date} - {slip.end_date}
                    </p>
                    <p className="text-xs text-gray-400">{slip.name}</p>
                  </div>
                  <p className="font-semibold text-green-600">
                    ${slip.net_pay?.toLocaleString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No hay recibos disponibles</p>
          )}
        </div>

        {/* Asistencia reciente */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Asistencia Reciente</h3>
          </div>
          {attendance && attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.slice(0, 5).map((att) => (
                <div key={att.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-sm font-medium text-gray-700">{att.attendance_date}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      att.status === 'Present'
                        ? 'bg-green-100 text-green-700'
                        : att.status === 'Absent'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No hay registros de asistencia</p>
          )}
        </div>

        {/* Avisos */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Avisos</h3>
            </div>
            <a href="/portal/notices" className="text-xs font-medium text-primary-600 hover:underline">
              Ver todos
            </a>
          </div>
          {recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((notice) => {
                const Icon = NOTICE_ICONS[notice.type] || Info;
                return (
                  <div key={notice.name} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <div className={clsx('mt-0.5 rounded p-1', NOTICE_COLORS[notice.type] || 'bg-gray-100 text-gray-600')}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 line-clamp-1">{notice.title}</p>
                      <p className="text-xs text-gray-400">{notice.posted_date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No hay avisos recientes</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Accesos Rápidos</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <a href="/portal/profile" className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            <FileText className="h-4 w-4 text-gray-400" />
            Ver mi perfil
          </a>
          <a href="/portal/payslips" className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            <DollarSign className="h-4 w-4 text-gray-400" />
            Mis recibos
          </a>
          <a href="/portal/attendance" className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            <CalendarCheck className="h-4 w-4 text-gray-400" />
            Mi asistencia
          </a>
          <a href="/portal/training" className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            Capacitación
          </a>
          <a href="/portal/notices" className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            <Bell className="h-4 w-4 text-gray-400" />
            Avisos
          </a>
        </div>
      </div>
    </div>
  );
}
