import { useState } from 'react';
import { MessageSquareWarning, Plus, AlertCircle, Search, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RoleGuard from '@/components/auth/RoleGuard';
import { useGrievances, useCreateGrievance, useUpdateGrievance } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { EmployeeGrievance } from '@/types/frappe';

const STATUS_COLORS: Record<EmployeeGrievance['status'], string> = {
  Open: 'bg-yellow-100 text-yellow-700',
  Investigated: 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
  Invalid: 'bg-gray-100 text-gray-500',
};

const STATUS_TRANSITIONS: Record<EmployeeGrievance['status'], EmployeeGrievance['status'][]> = {
  Open: ['Investigated', 'Invalid'],
  Investigated: ['Resolved', 'Invalid'],
  Resolved: [],
  Invalid: [],
};

const EMPTY_FORM = {
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
  status: 'Open' as EmployeeGrievance['status'],
  resolution_date: '',
  resolution_detail: '',
};

export default function Grievances() {
  const { data: grievances, isLoading, isError, refetch } = useGrievances();
  const createMutation = useCreateGrievance();
  const updateMutation = useUpdateGrievance();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployeeGrievance | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const totalCount = grievances?.length ?? 0;
  const openCount = grievances?.filter((g) => g.status === 'Open').length ?? 0;
  const investigatedCount = grievances?.filter((g) => g.status === 'Investigated').length ?? 0;
  const resolvedCount = grievances?.filter((g) => g.status === 'Resolved').length ?? 0;

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (g: EmployeeGrievance) => {
    setEditingItem(g);
    setForm({
      subject: g.subject,
      employee: g.employee,
      employee_name: g.employee_name,
      department: g.department,
      designation: g.designation,
      grievance_type: g.grievance_type,
      grievance_against_party: g.grievance_against_party,
      grievance_against: g.grievance_against,
      date: g.date,
      description: g.description,
      status: g.status,
      resolution_date: g.resolution_date ?? '',
      resolution_detail: g.resolution_detail ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          name: editingItem.name,
          data: {
            subject: form.subject,
            employee: form.employee,
            employee_name: form.employee_name,
            department: form.department,
            designation: form.designation,
            grievance_type: form.grievance_type,
            grievance_against_party: form.grievance_against_party,
            grievance_against: form.grievance_against,
            date: form.date,
            description: form.description,
            status: form.status,
            resolution_date: form.status === 'Resolved' ? form.resolution_date : '',
            resolution_detail: form.status === 'Resolved' ? form.resolution_detail : '',
          },
        });
        toast.success('Queja actualizada', 'Los cambios fueron guardados correctamente.');
      } else {
        await createMutation.mutateAsync({
          subject: form.subject,
          employee: form.employee,
          employee_name: form.employee_name,
          department: form.department,
          designation: form.designation,
          grievance_type: form.grievance_type,
          grievance_against_party: form.grievance_against_party,
          grievance_against: form.grievance_against,
          date: form.date,
          description: form.description,
          status: 'Open',
        } as Partial<EmployeeGrievance>);
        toast.success('Queja registrada', 'La queja fue registrada correctamente.');
      }
      closeModal();
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleStatusChange = async (g: EmployeeGrievance, newStatus: EmployeeGrievance['status']) => {
    try {
      const data: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'Resolved') {
        data.resolution_date = new Date().toISOString().split('T')[0];
      }
      await updateMutation.mutateAsync({ name: g.name, data });
      toast.success('Estado actualizado', `La queja pasó a "${newStatus}".`);
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await updateMutation.mutateAsync({ name: deleteTarget, data: { status: 'Invalid' } });
      toast.success('Queja eliminada', 'La queja fue marcada como inválida.');
    } catch (err) {
      toast.fromError(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
      render: (g) => {
        const transitions = STATUS_TRANSITIONS[g.status];
        return (
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                STATUS_COLORS[g.status]
              )}
            >
              {g.status}
            </span>
            {transitions.length > 0 && (
              <select
                className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-600 hover:border-gray-400 focus:outline-none"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleStatusChange(g, e.target.value as EmployeeGrievance['status']);
                  }
                }}
              >
                <option value="" disabled>
                  Cambiar...
                </option>
                {transitions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (g) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEditModal(g)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(g.name)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quejas</h1>
          <p className="mt-1 text-gray-500">Gestión de quejas de empleados</p>
        </div>
        <RoleGuard section="grievances" action="create">
          <button onClick={openCreateModal} className="btn-primary">
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
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar Queja' : 'Nueva Queja'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.subject || !form.employee || !form.description}
              className="btn-primary"
            >
              {isSaving
                ? 'Guardando...'
                : editingItem
                  ? 'Guardar Cambios'
                  : 'Registrar Queja'}
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

          {editingItem && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as EmployeeGrievance['status'] })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="Investigated">Investigated</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Invalid">Invalid</option>
                </select>
              </div>

              {form.status === 'Resolved' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Fecha de Resolución
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={form.resolution_date}
                      onChange={(e) => setForm({ ...form, resolution_date: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Detalle de Resolución
                    </label>
                    <textarea
                      className="input min-h-[80px]"
                      value={form.resolution_detail}
                      onChange={(e) => setForm({ ...form, resolution_detail: e.target.value })}
                      placeholder="Describe cómo se resolvió la queja..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar queja"
        message="¿Estás seguro de eliminar esta queja? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
