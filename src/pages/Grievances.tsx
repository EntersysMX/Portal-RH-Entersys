import { useState } from 'react';
import { MessageSquareWarning, Plus, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useGrievances, useCreateGrievance } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { EmployeeGrievance } from '@/types/frappe';

const STATUS_COLORS: Record<EmployeeGrievance['status'], string> = {
  Open: 'bg-yellow-100 text-yellow-700',
  Investigated: 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
  Invalid: 'bg-gray-100 text-gray-500',
};

export default function Grievances() {
  const { data: grievances, isLoading, isError, refetch } = useGrievances();
  const createMutation = useCreateGrievance();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    employee: '',
    employee_name: '',
    department: '',
    designation: '',
    grievance_type: '',
    grievance_against_party: '',
    grievance_against: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const totalCount = grievances?.length ?? 0;
  const openCount = grievances?.filter((g) => g.status === 'Open').length ?? 0;
  const investigatedCount = grievances?.filter((g) => g.status === 'Investigated').length ?? 0;
  const resolvedCount = grievances?.filter((g) => g.status === 'Resolved').length ?? 0;

  const columns: Column<EmployeeGrievance>[] = [
    {
      key: 'subject',
      header: 'Asunto',
      render: (g) => <p className="font-medium text-gray-900">{g.subject}</p>,
    },
    { key: 'employee_name', header: 'Empleado' },
    { key: 'department', header: 'Departamento' },
    { key: 'grievance_type', header: 'Tipo' },
    { key: 'date', header: 'Fecha' },
    {
      key: 'status',
      header: 'Estado',
      render: (g) => (
        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_COLORS[g.status]
          )}
        >
          {g.status}
        </span>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        status: 'Open',
      } as Partial<EmployeeGrievance>);
      toast.success('Queja registrada', 'La queja fue registrada correctamente.');
      setShowNewModal(false);
      setForm({
        subject: '',
        employee: '',
        employee_name: '',
        department: '',
        designation: '',
        grievance_type: '',
        grievance_against_party: '',
        grievance_against: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quejas</h1>
          <p className="mt-1 text-gray-500">Gestión de quejas de empleados</p>
        </div>
        <RoleGuard section="grievances" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Queja
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Quejas" value={totalCount} icon={MessageSquareWarning} color="purple" />
        <StatsCard title="Abiertas" value={openCount} icon={AlertCircle} color="orange" />
        <StatsCard title="Investigando" value={investigatedCount} icon={Search} color="blue" />
        <StatsCard title="Resueltas" value={resolvedCount} icon={CheckCircle} color="green" />
      </div>

      <DataTable
        columns={columns}
        data={grievances ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay quejas registradas."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Queja"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.subject || !form.employee || !form.description}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Guardando...' : 'Registrar Queja'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Asunto</label>
            <input
              className="input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Asunto de la queja"
            />
          </div>
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Designación</label>
              <input
                className="input"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Puesto"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Queja</label>
              <input
                className="input"
                value={form.grievance_type}
                onChange={(e) => setForm({ ...form, grievance_type: e.target.value })}
                placeholder="Tipo de queja"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Queja contra (parte)</label>
              <input
                className="input"
                value={form.grievance_against_party}
                onChange={(e) => setForm({ ...form, grievance_against_party: e.target.value })}
                placeholder="Ej: Employee, Department"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Queja contra</label>
              <input
                className="input"
                value={form.grievance_against}
                onChange={(e) => setForm({ ...form, grievance_against: e.target.value })}
                placeholder="Nombre o identificador"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              className="input min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe la queja en detalle..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
