import { useState } from 'react';
import { HardHat, Plus, Package, AlertTriangle, Users, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  useEquipmentAssignments,
  useCreateEquipmentAssignment,
  useUpdateEquipmentAssignment,
  useDeleteEquipmentAssignment,
} from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { EquipmentAssignment } from '@/types/frappe';

const STATUS_COLORS: Record<string, string> = {
  Asignado: 'bg-green-100 text-green-700',
  Devuelto: 'bg-gray-100 text-gray-600',
  Extraviado: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  Casco: 'bg-yellow-100 text-yellow-700',
  Chaleco: 'bg-orange-100 text-orange-700',
  Botas: 'bg-amber-100 text-amber-700',
  Guantes: 'bg-blue-100 text-blue-700',
  Uniforme: 'bg-purple-100 text-purple-700',
  Laptop: 'bg-cyan-100 text-cyan-700',
  Otro: 'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = {
  employee: '',
  employee_name: '',
  equipment_type: 'Casco' as EquipmentAssignment['equipment_type'],
  description: '',
  assigned_date: new Date().toISOString().split('T')[0],
  return_date: '',
  status: 'Asignado' as EquipmentAssignment['status'],
  notes: '',
};

export default function Equipment() {
  const { data: assignments, isLoading, isError, refetch } = useEquipmentAssignments();
  const createMutation = useCreateEquipmentAssignment();
  const updateMutation = useUpdateEquipmentAssignment();
  const deleteMutation = useDeleteEquipmentAssignment();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentAssignment | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const assigned = assignments?.filter((a) => a.status === 'Asignado').length ?? 0;
  const pendingReturn = assignments?.filter((a) => a.status === 'Asignado' && !a.return_date).length ?? 0;
  const lost = assignments?.filter((a) => a.status === 'Extraviado').length ?? 0;
  const uniqueEmployees = new Set(assignments?.filter((a) => a.status === 'Asignado').map((a) => a.employee)).size;

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (item: EquipmentAssignment) => {
    setEditingItem(item);
    setForm({
      employee: item.employee,
      employee_name: item.employee_name,
      equipment_type: item.equipment_type,
      description: item.description ?? '',
      assigned_date: item.assigned_date,
      return_date: item.return_date ?? '',
      status: item.status,
      notes: item.notes ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          name: editingItem.name,
          data: {
            employee: form.employee,
            employee_name: form.employee_name,
            equipment_type: form.equipment_type,
            description: form.description || undefined,
            assigned_date: form.assigned_date,
            return_date: form.return_date || undefined,
            status: form.status,
            notes: form.notes || undefined,
          },
        });
        toast.success('Asignación actualizada', 'Los cambios se guardaron correctamente.');
      } else {
        await createMutation.mutateAsync({
          employee: form.employee,
          employee_name: form.employee_name,
          equipment_type: form.equipment_type,
          description: form.description || undefined,
          assigned_date: form.assigned_date,
          status: 'Asignado',
          notes: form.notes || undefined,
        } as Partial<EquipmentAssignment>);
        toast.success('Equipo asignado', 'La asignaci\u00f3n se registr\u00f3 correctamente.');
      }
      closeModal();
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm('\u00bfEst\u00e1s seguro de eliminar esta asignaci\u00f3n? Esta acci\u00f3n no se puede deshacer.')) return;
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Asignaci\u00f3n eliminada', 'El registro fue eliminado correctamente.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleStatusChange = async (item: EquipmentAssignment, newStatus: EquipmentAssignment['status']) => {
    try {
      const data: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'Devuelto' && !item.return_date) {
        data.return_date = new Date().toISOString().split('T')[0];
      }
      await updateMutation.mutateAsync({ name: item.name, data });
      toast.success('Estado actualizado', `El equipo ahora est\u00e1 marcado como "${newStatus}".`);
    } catch (err) {
      toast.fromError(err);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns: Column<EquipmentAssignment>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (a) => <p className="font-medium text-gray-900">{a.employee_name}</p>,
    },
    {
      key: 'equipment_type',
      header: 'Tipo',
      render: (a) => (
        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            TYPE_COLORS[a.equipment_type] || TYPE_COLORS['Otro']
          )}
        >
          {a.equipment_type}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descripci\u00f3n',
      render: (a) => <span className="text-sm text-gray-600">{a.description || '\u2014'}</span>,
    },
    { key: 'assigned_date', header: 'Asignaci\u00f3n' },
    {
      key: 'return_date',
      header: 'Devoluci\u00f3n',
      render: (a) => <span className="text-sm text-gray-600">{a.return_date || '\u2014'}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (a) => (
        <div className="flex items-center gap-2">
          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[a.status])}>
            {a.status}
          </span>
          {a.status === 'Asignado' && (
            <select
              className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-600 hover:border-gray-300"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleStatusChange(a, e.target.value as EquipmentAssignment['status']);
                }
              }}
            >
              <option value="">Cambiar...</option>
              <option value="Devuelto">Devuelto</option>
              <option value="Extraviado">Extraviado</option>
            </select>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="flex gap-1">
          <RoleGuard section="equipment" action="edit">
            <button
              onClick={() => openEditModal(item)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Editar asignaci\u00f3n"
            >
              <Edit className="h-4 w-4" />
            </button>
          </RoleGuard>
          <RoleGuard section="equipment" action="delete">
            <button
              onClick={() => handleDelete(item.name)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Eliminar asignaci\u00f3n"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamiento</h1>
          <p className="mt-1 text-gray-500">Control de equipamiento y activos asignados al personal</p>
        </div>
        <RoleGuard section="equipment" action="create">
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Asignaci\u00f3n
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Equipos Asignados" value={assigned} icon={HardHat} color="blue" />
        <StatsCard title="Pendientes Devoluci\u00f3n" value={pendingReturn} icon={Package} color="orange" />
        <StatsCard title="Extraviados" value={lost} icon={AlertTriangle} color="red" />
        <StatsCard title="Empleados Equipados" value={uniqueEmployees} icon={Users} color="green" />
      </div>

      <DataTable
        columns={columns}
        data={assignments ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay asignaciones de equipo. Registra la primera desde el bot\u00f3n 'Nueva Asignaci\u00f3n'."
      />

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar Asignaci\u00f3n' : 'Nueva Asignaci\u00f3n de Equipo'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.employee}
              className="btn-primary"
            >
              {isSaving ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Asignar Equipo'}
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Equipo</label>
              <select
                className="input"
                value={form.equipment_type}
                onChange={(e) =>
                  setForm({ ...form, equipment_type: e.target.value as EquipmentAssignment['equipment_type'] })
                }
              >
                <option value="Casco">Casco</option>
                <option value="Chaleco">Chaleco</option>
                <option value="Botas">Botas</option>
                <option value="Guantes">Guantes</option>
                <option value="Uniforme">Uniforme</option>
                <option value="Laptop">Laptop</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Asignaci\u00f3n</label>
              <input
                type="date"
                className="input"
                value={form.assigned_date}
                onChange={(e) => setForm({ ...form, assigned_date: e.target.value })}
              />
            </div>
          </div>
          {editingItem && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as EquipmentAssignment['status'] })
                  }
                >
                  <option value="Asignado">Asignado</option>
                  <option value="Devuelto">Devuelto</option>
                  <option value="Extraviado">Extraviado</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Devoluci\u00f3n</label>
                <input
                  type="date"
                  className="input"
                  value={form.return_date}
                  onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripci\u00f3n</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripci\u00f3n del equipo (modelo, talla, etc.)"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              className="input min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
