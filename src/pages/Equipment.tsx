import { useState } from 'react';
import { HardHat, Plus, Package, AlertTriangle, Users, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useEquipmentAssignments, useCreateEquipmentAssignment } from '@/hooks/useFrappe';
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

export default function Equipment() {
  const { data: assignments, isLoading, isError, refetch } = useEquipmentAssignments();
  const createMutation = useCreateEquipmentAssignment();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    equipment_type: 'Casco' as EquipmentAssignment['equipment_type'],
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const assigned = assignments?.filter((a) => a.status === 'Asignado').length ?? 0;
  const pendingReturn = assignments?.filter((a) => a.status === 'Asignado' && !a.return_date).length ?? 0;
  const lost = assignments?.filter((a) => a.status === 'Extraviado').length ?? 0;
  const uniqueEmployees = new Set(assignments?.filter((a) => a.status === 'Asignado').map((a) => a.employee)).size;

  const columns: Column<EquipmentAssignment>[] = [
    { key: 'employee_name', header: 'Empleado', render: (a) => <p className="font-medium text-gray-900">{a.employee_name}</p> },
    {
      key: 'equipment_type', header: 'Tipo',
      render: (a) => <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[a.equipment_type] || TYPE_COLORS['Otro'])}>{a.equipment_type}</span>,
    },
    { key: 'description', header: 'Descripción', render: (a) => <span className="text-sm text-gray-600">{a.description || '—'}</span> },
    { key: 'assigned_date', header: 'Asignación' },
    { key: 'return_date', header: 'Devolución', render: (a) => <span className="text-sm text-gray-600">{a.return_date || '—'}</span> },
    {
      key: 'status', header: 'Estado',
      render: (a) => <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[a.status])}>{a.status}</span>,
    },
    {
      key: 'actions', header: 'Acciones',
      render: () => (
        <div className="flex gap-1">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
          <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        status: 'Asignado',
      } as Partial<EquipmentAssignment>);
      toast.success('Equipo asignado', 'La asignación se registró correctamente.');
      setShowNewModal(false);
      setForm({ employee: '', employee_name: '', equipment_type: 'Casco', description: '', assigned_date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamiento</h1>
          <p className="mt-1 text-gray-500">Control de equipamiento y activos asignados al personal</p>
        </div>
        <RoleGuard section="equipment" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Asignación
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Equipos Asignados" value={assigned} icon={HardHat} color="blue" />
        <StatsCard title="Pendientes Devolución" value={pendingReturn} icon={Package} color="orange" />
        <StatsCard title="Extraviados" value={lost} icon={AlertTriangle} color="red" />
        <StatsCard title="Empleados Equipados" value={uniqueEmployees} icon={Users} color="green" />
      </div>

      <DataTable
        columns={columns}
        data={assignments ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay asignaciones de equipo. Registra la primera desde el botón 'Nueva Asignación'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Asignación de Equipo"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employee} className="btn-primary">
              {createMutation.isPending ? 'Guardando...' : 'Asignar Equipo'}
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Equipo</label>
              <select className="input" value={form.equipment_type} onChange={(e) => setForm({ ...form, equipment_type: e.target.value as EquipmentAssignment['equipment_type'] })}>
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Asignación</label>
              <input type="date" className="input" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del equipo (modelo, talla, etc.)" />
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
