import { useState } from 'react';
import { CalendarCheck, UserCheck, UserX, Clock } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAttendance } from '@/hooks/useFrappe';
import type { Attendance } from '@/types/frappe';

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const { data: attendanceData, isLoading, isError, refetch } = useAttendance(
    { attendance_date: dateFilter },
    100
  );

  const presentCount = attendanceData?.filter((a) => a.status === 'Present').length ?? 0;
  const absentCount = attendanceData?.filter((a) => a.status === 'Absent').length ?? 0;
  const wfhCount = attendanceData?.filter((a) => a.status === 'Work From Home').length ?? 0;
  const lateCount = attendanceData?.filter((a) => a.late_entry).length ?? 0;

  const columns: Column<Attendance>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (att) => (
        <div>
          <p className="font-medium text-gray-900">{att.employee_name}</p>
          <p className="text-xs text-gray-400">{att.employee}</p>
        </div>
      ),
    },
    { key: 'attendance_date', header: 'Fecha' },
    {
      key: 'status',
      header: 'Estado',
      render: (att) => <StatusBadge status={att.status} />,
    },
    { key: 'shift', header: 'Turno' },
    {
      key: 'late_entry',
      header: 'Retardo',
      render: (att) =>
        att.late_entry ? (
          <span className="badge-warning">Sí</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'early_exit',
      header: 'Salida Temprana',
      render: (att) =>
        att.early_exit ? (
          <span className="badge-warning">Sí</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
          <p className="mt-1 text-gray-500">Control de asistencia y puntualidad</p>
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input w-auto"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Presentes" value={presentCount} icon={UserCheck} color="green" />
        <StatsCard title="Ausentes" value={absentCount} icon={UserX} color="red" />
        <StatsCard title="Home Office" value={wfhCount} icon={CalendarCheck} color="blue" />
        <StatsCard title="Con Retardo" value={lateCount} icon={Clock} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={attendanceData ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay registros de asistencia para esta fecha"
      />
    </div>
  );
}
