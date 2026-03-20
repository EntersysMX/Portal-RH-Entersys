import { useState } from 'react';
import { clsx } from 'clsx';
import { Clock, Plus, CalendarCheck, Users } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useShiftTypes, useShiftAssignments, useCreateShiftAssignment } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { ShiftType, ShiftAssignment } from '@/types/frappe';

export default function Shifts() {
  const [activeTab, setActiveTab] = useState<'types' | 'assignments'>('types');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    employee: '',
    shift_type: '',
    start_date: '',
    end_date: '',
    company: '',
  });

  const { data: shiftTypes, isLoading: loadingTypes, isError: errorTypes, refetch: refetchTypes } = useShiftTypes();
  const { data: assignments, isLoading: loadingAssignments, isError: errorAssignments, refetch: refetchAssignments } = useShiftAssignments();
  const createMutation = useCreateShiftAssignment();

  const activeCount = assignments?.filter((a) => a.status === 'Active').length ?? 0;
  const inactiveCount = assignments?.filter((a) => a.status === 'Inactive').length ?? 0;
  const totalAssignments = assignments?.length ?? 0;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(newAssignment);
      toast.success('Asignación creada', 'La asignación de turno se creó correctamente.');
      setShowNewModal(false);
      setNewAssignment({ employee: '', shift_type: '', start_date: '', end_date: '', company: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const typeColumns: Column<ShiftType>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'start_time', header: 'Hora Inicio' },
    { key: 'end_time', header: 'Hora Fin' },
    {
      key: 'holiday_list',
      header: 'Lista de Festivos',
      render: (st) => st.holiday_list || <span className="text-gray-300">—</span>,
    },
  ];

  const assignmentColumns: Column<ShiftAssignment>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (sa) => (
        <div>
          <p className="font-medium text-gray-900">{sa.employee_name}</p>
          <p className="text-xs text-gray-400">{sa.employee}</p>
        </div>
      ),
    },
    { key: 'shift_type', header: 'Tipo de Turno' },
    { key: 'start_date', header: 'Fecha Inicio' },
    {
      key: 'end_date',
      header: 'Fecha Fin',
      render: (sa) => sa.end_date || <span className="text-gray-300">—</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (sa) => (
        <span
          className={clsx(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            sa.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {sa.status === 'Active' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    { key: 'company', header: 'Empresa' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
          <p className="mt-1 text-gray-500">Gestión de tipos de turno y asignaciones</p>
        </div>
        <RoleGuard section="shifts" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Asignación
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Tipos de Turno" value={shiftTypes?.length ?? 0} icon={Clock} color="blue" />
        <StatsCard title="Asignaciones Activas" value={activeCount} icon={CalendarCheck} color="green" />
        <StatsCard title="Asignaciones Inactivas" value={inactiveCount} icon={Users} color="orange" />
        <StatsCard title="Total Asignaciones" value={totalAssignments} icon={CalendarCheck} color="purple" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'types' as const, label: 'Tipos de Turno' },
            { id: 'assignments' as const, label: 'Asignaciones' },
          ].map((tab) => (
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

      {/* Content */}
      {activeTab === 'types' && (
        <DataTable
          columns={typeColumns}
          data={shiftTypes ?? []}
          isLoading={loadingTypes}
          isError={errorTypes}
          onRetry={refetchTypes}
          emptyMessage="No hay tipos de turno configurados"
        />
      )}

      {activeTab === 'assignments' && (
        <DataTable
          columns={assignmentColumns}
          data={assignments ?? []}
          isLoading={loadingAssignments}
          isError={errorAssignments}
          onRetry={refetchAssignments}
          emptyMessage="No hay asignaciones de turno registradas"
        />
      )}

      {/* New Assignment Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Asignación de Turno"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Crear Asignación'}
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
                value={newAssignment.employee}
                onChange={(e) => setNewAssignment({ ...newAssignment, employee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Turno</label>
              <select
                className="input"
                value={newAssignment.shift_type}
                onChange={(e) => setNewAssignment({ ...newAssignment, shift_type: e.target.value })}
              >
                <option value="">Seleccionar turno</option>
                {(shiftTypes ?? []).map((st) => (
                  <option key={st.name} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                className="input"
                value={newAssignment.start_date}
                onChange={(e) => setNewAssignment({ ...newAssignment, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                className="input"
                value={newAssignment.end_date}
                onChange={(e) => setNewAssignment({ ...newAssignment, end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
              <input
                className="input"
                placeholder="Nombre de la empresa"
                value={newAssignment.company}
                onChange={(e) => setNewAssignment({ ...newAssignment, company: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
