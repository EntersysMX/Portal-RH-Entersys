import { useState } from 'react';
import { UserX, Plus, Clock, Users, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useSeparations, useCreateSeparation } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { EmployeeSeparation } from '@/types/frappe';

const statusStyles: Record<EmployeeSeparation['boarding_status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  'In Process': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<EmployeeSeparation['boarding_status'], string> = {
  Pending: 'Pendiente',
  'In Process': 'En Proceso',
  Completed: 'Completada',
};

const INITIAL_FORM = {
  employee: '',
  employee_name: '',
  department: '',
  designation: '',
  resignation_letter_date: '',
  boarding_begins_on: '',
  company: '',
};

export default function Separations() {
  const { data: separations, isLoading, isError, refetch } = useSeparations();
  const createMutation = useCreateSeparation();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const total = separations?.length ?? 0;
  const pendingCount = separations?.filter((s) => s.boarding_status === 'Pending').length ?? 0;
  const inProcessCount = separations?.filter((s) => s.boarding_status === 'In Process').length ?? 0;
  const completedCount = separations?.filter((s) => s.boarding_status === 'Completed').length ?? 0;

  const columns: Column<EmployeeSeparation>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.employee_name}</p>
          <p className="text-xs text-gray-400">{row.employee}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Departamento' },
    { key: 'designation', header: 'Puesto' },
    {
      key: 'boarding_status',
      header: 'Estado',
      render: (row) => (
        <span
          className={clsx(
            'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusStyles[row.boarding_status],
          )}
        >
          {statusLabels[row.boarding_status]}
        </span>
      ),
    },
    { key: 'resignation_letter_date', header: 'Fecha Renuncia' },
    { key: 'boarding_begins_on', header: 'Inicio Separacion' },
    { key: 'company', header: 'Empresa' },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        employee: form.employee,
        employee_name: form.employee_name,
        department: form.department,
        designation: form.designation,
        resignation_letter_date: form.resignation_letter_date || undefined,
        boarding_begins_on: form.boarding_begins_on || undefined,
        company: form.company,
      });
      toast.success('Separacion creada', `Separacion registrada para ${form.employee_name || form.employee}.`);
      setShowNewModal(false);
      setForm(INITIAL_FORM);
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Separaciones</h1>
          <p className="mt-1 text-gray-500">Gestion de bajas y separaciones de empleados</p>
        </div>
        <RoleGuard section="separations" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Separacion
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Separaciones" value={total} icon={UserX} color="red" />
        <StatsCard title="Pendientes" value={pendingCount} icon={Clock} color="orange" />
        <StatsCard title="En Proceso" value={inProcessCount} icon={Users} color="blue" />
        <StatsCard title="Completadas" value={completedCount} icon={CheckCircle} color="green" />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={separations ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay separaciones registradas"
      />

      {/* New Separation Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Separacion"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.employee}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creando...' : 'Registrar Separacion'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ID Empleado</label>
              <input
                className="input"
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                placeholder="HR-EMP-00001"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre Empleado</label>
              <input
                className="input"
                value={form.employee_name}
                onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Departamento</label>
              <input
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Departamento"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Puesto</label>
              <input
                className="input"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Puesto"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Renuncia</label>
              <input
                type="date"
                className="input"
                value={form.resignation_letter_date}
                onChange={(e) => setForm({ ...form, resignation_letter_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Inicio de Separacion</label>
              <input
                type="date"
                className="input"
                value={form.boarding_begins_on}
                onChange={(e) => setForm({ ...form, boarding_begins_on: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Empresa"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
