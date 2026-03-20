import { useState } from 'react';
import { Plus, CalendarX2, Calendar, ListChecks, PartyPopper } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { toast } from '@/components/ui/Toast';
import {
  useLeaves,
  useLeaveTypes,
  useLeaveAllocations,
  useCreateLeaveAllocation,
  useLeavePolicies,
  useHolidayLists,
} from '@/hooks/useFrappe';
import type {
  LeaveApplication,
  LeaveType,
  LeaveAllocation,
  LeavePolicy,
  HolidayList,
} from '@/types/frappe';

type Tab = 'applications' | 'types' | 'allocations' | 'policies' | 'holidays';

const TABS: { id: Tab; label: string }[] = [
  { id: 'applications', label: 'Solicitudes' },
  { id: 'types', label: 'Tipos' },
  { id: 'allocations', label: 'Asignación' },
  { id: 'policies', label: 'Políticas' },
  { id: 'holidays', label: 'Días Festivos' },
];

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    employee: '',
    leave_type: '',
    new_leaves_allocated: 0,
    from_date: '',
    to_date: '',
  });

  // Data queries
  const { data: leaves, isLoading: loadingLeaves, isError: errorLeaves, refetch: refetchLeaves } = useLeaves();
  const { data: leaveTypes, isLoading: loadingTypes, isError: errorTypes, refetch: refetchTypes } = useLeaveTypes();
  const { data: allocations, isLoading: loadingAllocs, isError: errorAllocs, refetch: refetchAllocs } = useLeaveAllocations();
  const { data: policies, isLoading: loadingPolicies, isError: errorPolicies, refetch: refetchPolicies } = useLeavePolicies();
  const { data: holidays, isLoading: loadingHolidays, isError: errorHolidays, refetch: refetchHolidays } = useHolidayLists();
  const createAllocationMutation = useCreateLeaveAllocation();

  const pendingCount = leaves?.filter((l) => l.status === 'Open').length ?? 0;
  const approvedCount = leaves?.filter((l) => l.status === 'Approved').length ?? 0;

  // Columns
  const applicationColumns: Column<LeaveApplication>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (l) => (
        <div>
          <p className="font-medium text-gray-900">{l.employee_name}</p>
          <p className="text-xs text-gray-400">{l.employee}</p>
        </div>
      ),
    },
    { key: 'leave_type', header: 'Tipo' },
    { key: 'from_date', header: 'Desde' },
    { key: 'to_date', header: 'Hasta' },
    { key: 'total_leave_days', header: 'Días' },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => <StatusBadge status={l.status} />,
    },
  ];

  const typeColumns: Column<LeaveType>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'max_leaves_allowed', header: 'Máx. Días' },
    {
      key: 'is_carry_forward',
      header: 'Carry Forward',
      render: (t) => t.is_carry_forward ? <span className="badge-success">Sí</span> : <span className="text-gray-300">No</span>,
    },
    {
      key: 'is_earned_leave',
      header: 'Earned Leave',
      render: (t) => t.is_earned_leave ? <span className="badge-success">Sí</span> : <span className="text-gray-300">No</span>,
    },
    {
      key: 'allow_negative',
      header: 'Saldo Negativo',
      render: (t) => t.allow_negative ? <span className="badge-warning">Sí</span> : <span className="text-gray-300">No</span>,
    },
  ];

  const allocationColumns: Column<LeaveAllocation>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (a) => (
        <div>
          <p className="font-medium text-gray-900">{a.employee_name}</p>
          <p className="text-xs text-gray-400">{a.employee}</p>
        </div>
      ),
    },
    { key: 'leave_type', header: 'Tipo' },
    { key: 'new_leaves_allocated', header: 'Días Asignados' },
    { key: 'total_leaves_allocated', header: 'Total' },
    { key: 'from_date', header: 'Desde' },
    { key: 'to_date', header: 'Hasta' },
  ];

  const policyColumns: Column<LeavePolicy>[] = [
    { key: 'name', header: 'Nombre' },
    {
      key: 'leave_policy_details',
      header: 'Detalle',
      render: (p) =>
        p.leave_policy_details?.length
          ? p.leave_policy_details.map((d) => `${d.leave_type}: ${d.annual_allocation}d`).join(', ')
          : '-',
    },
  ];

  const holidayColumns: Column<HolidayList>[] = [
    { key: 'holiday_list_name', header: 'Nombre' },
    { key: 'from_date', header: 'Desde' },
    { key: 'to_date', header: 'Hasta' },
    { key: 'total_holidays', header: 'Total Días' },
    { key: 'country', header: 'País' },
  ];

  const handleCreateAllocation = async () => {
    try {
      await createAllocationMutation.mutateAsync(newAllocation as Partial<LeaveAllocation>);
      toast.success('Asignación creada', 'La asignación de días se registró correctamente.');
      setShowAllocationModal(false);
      setNewAllocation({ employee: '', leave_type: '', new_leaves_allocated: 0, from_date: '', to_date: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacaciones</h1>
          <p className="mt-1 text-gray-500">Gestión de permisos, vacaciones y días festivos</p>
        </div>
        {activeTab === 'allocations' && (
          <RoleGuard section="leave-management" action="create">
            <button onClick={() => setShowAllocationModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nueva Asignación
            </button>
          </RoleGuard>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Solicitudes Pendientes" value={pendingCount} icon={CalendarX2} color="orange" />
        <StatsCard title="Aprobadas" value={approvedCount} icon={Calendar} color="green" />
        <StatsCard title="Tipos de Permiso" value={leaveTypes?.length ?? 0} icon={ListChecks} color="blue" />
        <StatsCard title="Días Festivos" value={holidays?.reduce((s, h) => s + (h.total_holidays ?? 0), 0) ?? 0} icon={PartyPopper} color="purple" />
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

      {/* Tab content */}
      {activeTab === 'applications' && (
        <DataTable<LeaveApplication>
          columns={applicationColumns}
          data={leaves ?? []}
          isLoading={loadingLeaves}
          isError={errorLeaves}
          onRetry={refetchLeaves}
          emptyMessage="No hay solicitudes de permiso"
        />
      )}

      {activeTab === 'types' && (
        <DataTable<LeaveType>
          columns={typeColumns}
          data={leaveTypes ?? []}
          isLoading={loadingTypes}
          isError={errorTypes}
          onRetry={refetchTypes}
          emptyMessage="No hay tipos de permiso configurados"
        />
      )}

      {activeTab === 'allocations' && (
        <DataTable<LeaveAllocation>
          columns={allocationColumns}
          data={allocations ?? []}
          isLoading={loadingAllocs}
          isError={errorAllocs}
          onRetry={refetchAllocs}
          emptyMessage="No hay asignaciones de días"
        />
      )}

      {activeTab === 'policies' && (
        <DataTable<LeavePolicy>
          columns={policyColumns}
          data={policies ?? []}
          isLoading={loadingPolicies}
          isError={errorPolicies}
          onRetry={refetchPolicies}
          emptyMessage="No hay políticas de permiso configuradas"
        />
      )}

      {activeTab === 'holidays' && (
        <DataTable<HolidayList>
          columns={holidayColumns}
          data={holidays ?? []}
          isLoading={loadingHolidays}
          isError={errorHolidays}
          onRetry={refetchHolidays}
          emptyMessage="No hay listas de días festivos"
        />
      )}

      {/* New Allocation Modal */}
      <Modal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title="Nueva Asignación de Días"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowAllocationModal(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={handleCreateAllocation}
              disabled={createAllocationMutation.isPending || !newAllocation.employee || !newAllocation.leave_type}
              className="btn-primary"
            >
              {createAllocationMutation.isPending ? 'Creando...' : 'Crear Asignación'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empleado (ID)</label>
              <input
                className="input"
                placeholder="HR-EMP-00001"
                value={newAllocation.employee}
                onChange={(e) => setNewAllocation({ ...newAllocation, employee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Permiso</label>
              <select
                className="input"
                value={newAllocation.leave_type}
                onChange={(e) => setNewAllocation({ ...newAllocation, leave_type: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {leaveTypes?.map((lt) => (
                  <option key={lt.name} value={lt.name}>{lt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Días a Asignar</label>
              <input
                type="number"
                className="input"
                value={newAllocation.new_leaves_allocated || ''}
                onChange={(e) => setNewAllocation({ ...newAllocation, new_leaves_allocated: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Desde</label>
              <input
                type="date"
                className="input"
                value={newAllocation.from_date}
                onChange={(e) => setNewAllocation({ ...newAllocation, from_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Hasta</label>
              <input
                type="date"
                className="input"
                value={newAllocation.to_date}
                onChange={(e) => setNewAllocation({ ...newAllocation, to_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
