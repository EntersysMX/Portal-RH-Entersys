import { useState } from 'react';
import { ShieldPlus, Plus, Calendar, DollarSign, Trash2, Edit, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useIncapacities, useCreateIncapacity, useUpdateIncapacity, useDeleteIncapacity } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Incapacity } from '@/types/frappe';

const TYPE_COLORS: Record<string, string> = {
  'Enfermedad General': 'bg-blue-100 text-blue-700',
  'Riesgo de Trabajo': 'bg-red-100 text-red-700',
  'Maternidad': 'bg-pink-100 text-pink-700',
  'Paternidad': 'bg-cyan-100 text-cyan-700',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  Active: 'Activa',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
};

const emptyForm = {
  employee: '',
  employee_name: '',
  incapacity_type: 'Enfermedad General' as Incapacity['incapacity_type'],
  folio: '',
  start_date: '',
  end_date: '',
  days: 0,
  estimated_cost: 0,
  notes: '',
};

export default function Disabilities() {
  const { data: incapacities, isLoading, isError, refetch } = useIncapacities();
  const createMutation = useCreateIncapacity();
  const updateMutation = useUpdateIncapacity();
  const deleteMutation = useDeleteIncapacity();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Incapacity | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const activeCount = incapacities?.filter((i) => i.status === 'Active').length ?? 0;
  const totalDays = incapacities?.reduce((sum, i) => sum + (i.days || 0), 0) ?? 0;
  const totalCost = incapacities?.reduce((sum, i) => sum + (i.estimated_cost || 0), 0) ?? 0;
  const typeCount: Record<string, number> = {};
  incapacities?.forEach((i) => { typeCount[i.incapacity_type] = (typeCount[i.incapacity_type] || 0) + 1; });
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (item: Incapacity) => {
    setEditingItem(item);
    setForm({
      employee: item.employee,
      employee_name: item.employee_name,
      incapacity_type: item.incapacity_type,
      folio: item.folio ?? '',
      start_date: item.start_date,
      end_date: item.end_date,
      days: item.days,
      estimated_cost: item.estimated_cost ?? 0,
      notes: item.notes ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          name: editingItem.name,
          data: { ...form },
        });
        toast.success('Incapacidad actualizada', 'Los cambios se guardaron correctamente.');
      } else {
        await createMutation.mutateAsync({
          ...form,
          status: 'Active',
        } as Partial<Incapacity>);
        toast.success('Incapacidad registrada', 'Se registró correctamente.');
      }
      closeModal();
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta incapacidad? Esta acción no se puede deshacer.')) return;
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Incapacidad eliminada', 'Se eliminó correctamente.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleStatusChange = async (item: Incapacity, newStatus: Incapacity['status']) => {
    try {
      await updateMutation.mutateAsync({
        name: item.name,
        data: { status: newStatus },
      });
      toast.success('Estado actualizado', `La incapacidad ahora está ${STATUS_LABELS[newStatus]?.toLowerCase() ?? newStatus}.`);
    } catch (err) {
      toast.fromError(err);
    }
  };

  const columns: Column<Incapacity>[] = [
    { key: 'employee_name', header: 'Empleado', render: (i) => <p className="font-medium text-gray-900">{i.employee_name}</p> },
    {
      key: 'incapacity_type', header: 'Tipo',
      render: (i) => <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[i.incapacity_type])}>{i.incapacity_type}</span>,
    },
    { key: 'folio', header: 'Folio', render: (i) => <span className="text-sm text-gray-600">{i.folio || '—'}</span> },
    { key: 'start_date', header: 'Inicio' },
    { key: 'end_date', header: 'Fin' },
    { key: 'days', header: 'Días', render: (i) => <span className="font-medium">{i.days}</span> },
    {
      key: 'status', header: 'Estado',
      render: (i) => (
        <select
          className={clsx('cursor-pointer rounded-full border-0 px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400', STATUS_COLORS[i.status])}
          value={i.status}
          onChange={(e) => handleStatusChange(i, e.target.value as Incapacity['status'])}
        >
          <option value="Active">Activa</option>
          <option value="Completed">Completada</option>
          <option value="Cancelled">Cancelada</option>
        </select>
      ),
    },
    {
      key: 'actions', header: 'Acciones',
      render: (item) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEditModal(item)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(item.name)}
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
          <h1 className="text-2xl font-bold text-gray-900">Incapacidades</h1>
          <p className="mt-1 text-gray-500">Control de incapacidades médicas y seguimiento</p>
        </div>
        <RoleGuard section="disabilities" action="create">
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Incapacidad
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Activas" value={activeCount} icon={ShieldPlus} color="green" />
        <StatsCard title="Total Días Perdidos" value={totalDays} icon={Calendar} color="red" />
        <StatsCard title="Tipo más Frecuente" value={topType} icon={Activity} color="purple" />
        <StatsCard title="Costo Estimado" value={`$${totalCost.toLocaleString()}`} icon={DollarSign} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={incapacities ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay incapacidades registradas."
      />

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar Incapacidad' : 'Nueva Incapacidad'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={isSaving || !form.employee} className="btn-primary">
              {isSaving ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ID Empleado</label>
              <input className="input" value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} placeholder="HR-EMP-00001" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre Empleado</label>
              <input className="input" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} placeholder="Nombre completo" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
              <select className="input" value={form.incapacity_type} onChange={(e) => setForm({ ...form, incapacity_type: e.target.value as Incapacity['incapacity_type'] })}>
                <option value="Enfermedad General">Enfermedad General</option>
                <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                <option value="Maternidad">Maternidad</option>
                <option value="Paternidad">Paternidad</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Folio</label>
              <input className="input" value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} placeholder="Folio IMSS" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Días</label>
              <input type="number" className="input" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Costo Estimado</label>
            <input type="number" className="input" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: Number(e.target.value) })} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
