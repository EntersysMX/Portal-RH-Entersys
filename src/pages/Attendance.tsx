import { useState } from 'react';
import { CalendarCheck, UserCheck, UserX, Clock, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useAttendance, useAttendanceRequests, useCreateAttendanceRequest } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Attendance, AttendanceRequest } from '@/types/frappe';

type Tab = 'attendance' | 'requests';

const TABS: { id: Tab; label: string }[] = [
  { id: 'attendance', label: 'Asistencia' },
  { id: 'requests', label: 'Solicitudes' },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    employee: '',
    from_date: '',
    to_date: '',
    reason: '',
    explanation: '',
    half_day: false,
  });

  const { data: attendanceData, isLoading, isError, refetch } = useAttendance(
    { attendance_date: dateFilter },
    100
  );
  const { data: requests, isLoading: loadingRequests, isError: errorRequests, refetch: refetchRequests } = useAttendanceRequests();
  const createRequestMutation = useCreateAttendanceRequest();

  const presentCount = attendanceData?.filter((a) => a.status === 'Present').length ?? 0;
  const absentCount = attendanceData?.filter((a) => a.status === 'Absent').length ?? 0;
  const wfhCount = attendanceData?.filter((a) => a.status === 'Work From Home').length ?? 0;
  const lateCount = attendanceData?.filter((a) => a.late_entry).length ?? 0;

  const attendanceColumns: Column<Attendance>[] = [
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
    { key: 'status', header: 'Estado', render: (att) => <StatusBadge status={att.status} /> },
    { key: 'shift', header: 'Turno' },
    {
      key: 'late_entry',
      header: 'Retardo',
      render: (att) => att.late_entry ? <span className="badge-warning">Sí</span> : <span className="text-gray-300">—</span>,
    },
    {
      key: 'early_exit',
      header: 'Salida Temprana',
      render: (att) => att.early_exit ? <span className="badge-warning">Sí</span> : <span className="text-gray-300">—</span>,
    },
  ];

  const requestColumns: Column<AttendanceRequest>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employee_name}</p>
          <p className="text-xs text-gray-400">{r.employee}</p>
        </div>
      ),
    },
    { key: 'from_date', header: 'Desde' },
    { key: 'to_date', header: 'Hasta' },
    { key: 'reason', header: 'Razón' },
    {
      key: 'half_day',
      header: 'Medio Día',
      render: (r) => r.half_day ? <span className="badge-info">Sí</span> : <span className="text-gray-300">No</span>,
    },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const handleCreateRequest = async () => {
    try {
      await createRequestMutation.mutateAsync(newRequest as Partial<AttendanceRequest>);
      toast.success('Solicitud creada', 'La solicitud de asistencia se registró correctamente.');
      setShowRequestModal(false);
      setNewRequest({ employee: '', from_date: '', to_date: '', reason: '', explanation: '', half_day: false });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
          <p className="mt-1 text-gray-500">Control de asistencia y puntualidad</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'attendance' && (
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input w-auto" />
          )}
          {activeTab === 'requests' && (
            <RoleGuard section="attendance" action="create">
              <button onClick={() => setShowRequestModal(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nueva Solicitud
              </button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Presentes" value={presentCount} icon={UserCheck} color="green" />
        <StatsCard title="Ausentes" value={absentCount} icon={UserX} color="red" />
        <StatsCard title="Home Office" value={wfhCount} icon={CalendarCheck} color="blue" />
        <StatsCard title="Con Retardo" value={lateCount} icon={Clock} color="orange" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'attendance' && (
        <DataTable<Attendance>
          columns={attendanceColumns}
          data={attendanceData ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyMessage="No hay registros de asistencia para esta fecha"
        />
      )}

      {activeTab === 'requests' && (
        <DataTable<AttendanceRequest>
          columns={requestColumns}
          data={requests ?? []}
          isLoading={loadingRequests}
          isError={errorRequests}
          onRetry={refetchRequests}
          emptyMessage="No hay solicitudes de asistencia"
        />
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Nueva Solicitud de Asistencia"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateRequest} disabled={createRequestMutation.isPending || !newRequest.employee} className="btn-primary">
              {createRequestMutation.isPending ? 'Creando...' : 'Crear Solicitud'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empleado (ID)</label>
              <input className="input" placeholder="HR-EMP-00001" value={newRequest.employee} onChange={(e) => setNewRequest({ ...newRequest, employee: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Razón</label>
              <input className="input" value={newRequest.reason} onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Desde</label>
              <input type="date" className="input" value={newRequest.from_date} onChange={(e) => setNewRequest({ ...newRequest, from_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Hasta</label>
              <input type="date" className="input" value={newRequest.to_date} onChange={(e) => setNewRequest({ ...newRequest, to_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Explicación</label>
            <textarea className="input min-h-[80px]" value={newRequest.explanation} onChange={(e) => setNewRequest({ ...newRequest, explanation: e.target.value })} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={newRequest.half_day} onChange={(e) => setNewRequest({ ...newRequest, half_day: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Medio día</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
