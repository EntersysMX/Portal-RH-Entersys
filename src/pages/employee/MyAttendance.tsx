import { useState } from 'react';
import { CalendarCheck, Clock, AlertCircle } from 'lucide-react';
import { useMyAttendance, useMyLeaves } from '@/hooks/useFrappe';
import StatusBadge from '@/components/ui/StatusBadge';
import StatsCard from '@/components/ui/StatsCard';
import { useAuthStore } from '@/store/authStore';

export default function MyAttendance() {
  const user = useAuthStore((s) => s.user);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;

  const { data: attendance, isLoading } = useMyAttendance(
    {
      attendance_date: ['between', [monthStart, monthEnd]],
    },
    50
  );

  const { data: leaves } = useMyLeaves(undefined, 20);

  // Stats
  const present = attendance?.filter((a) => a.status === 'Present').length ?? 0;
  const absent = attendance?.filter((a) => a.status === 'Absent').length ?? 0;
  const halfDay = attendance?.filter((a) => a.status === 'Half Day').length ?? 0;
  const wfh = attendance?.filter((a) => a.status === 'Work From Home').length ?? 0;
  const lateEntries = attendance?.filter((a) => a.late_entry).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Asistencia</h1>
          <p className="mt-1 text-gray-500">
            Registro de asistencia de {user?.employee_name || user?.full_name}
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input w-auto"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Presente" value={String(present)} icon={CalendarCheck} color="green" />
        <StatsCard title="Ausente" value={String(absent)} icon={AlertCircle} color="red" />
        <StatsCard title="Medio día" value={String(halfDay)} icon={Clock} color="orange" />
        <StatsCard title="Home Office" value={String(wfh)} icon={CalendarCheck} color="blue" />
        <StatsCard title="Llegadas tarde" value={String(lateEntries)} icon={Clock} color="orange" />
      </div>

      {/* Attendance table */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Detalle de Asistencia</h3>
        </div>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : attendance && attendance.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Turno</th>
                  <th>Llegada tarde</th>
                  <th>Salida temprana</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => (
                  <tr key={att.name}>
                    <td className="font-medium text-gray-900">{att.attendance_date}</td>
                    <td>
                      <StatusBadge status={att.status} />
                    </td>
                    <td className="text-gray-600">{att.shift || '—'}</td>
                    <td>
                      {att.late_entry ? (
                        <span className="badge badge-warning">Sí</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      {att.early_exit ? (
                        <span className="badge badge-warning">Sí</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin registros</h3>
            <p className="mt-2 text-gray-500">
              No se encontró asistencia para este mes.
            </p>
          </div>
        )}
      </div>

      {/* Leaves section */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Mis Solicitudes de Permiso</h3>
        </div>
        {leaves && leaves.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Días</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.name}>
                    <td className="font-medium text-gray-900">{leave.leave_type}</td>
                    <td className="text-gray-600">{leave.from_date}</td>
                    <td className="text-gray-600">{leave.to_date}</td>
                    <td className="text-gray-900">{leave.total_leave_days}</td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No tienes solicitudes de permiso.
          </div>
        )}
      </div>
    </div>
  );
}
