import { useState } from 'react';
import { PiggyBank, Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useSavingsFund, useCreateSavingsFundEntry, useDeleteSavingsFundEntry } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { SavingsFundEntry } from '@/types/frappe';

const ENTRY_TYPE_COLORS: Record<string, string> = {
  'Aportaci\u00f3n': 'bg-green-100 text-green-700',
  'Retiro': 'bg-red-100 text-red-700',
  'Rendimiento': 'bg-blue-100 text-blue-700',
};

const formatCurrency = (v: number) =>
  v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default function SavingsFund() {
  const { data: entries, isLoading, isError, refetch } = useSavingsFund();
  const createMutation = useCreateSavingsFundEntry();
  const deleteMutation = useDeleteSavingsFundEntry();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    entry_type: 'Aportaci\u00f3n' as SavingsFundEntry['entry_type'],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const totalAportaciones = entries?.filter((e) => e.entry_type === 'Aportaci\u00f3n').reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalRetiros = entries?.filter((e) => e.entry_type === 'Retiro').reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalRendimientos = entries?.filter((e) => e.entry_type === 'Rendimiento').reduce((s, e) => s + e.amount, 0) ?? 0;
  const saldo = totalAportaciones + totalRendimientos - totalRetiros;

  const columns: Column<SavingsFundEntry>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (e) => <p className="font-medium text-gray-900">{e.employee_name}</p>,
    },
    {
      key: 'entry_type',
      header: 'Tipo',
      render: (e) => (
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', ENTRY_TYPE_COLORS[e.entry_type])}>
          {e.entry_type}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (e) => <span className="font-medium text-gray-900">{formatCurrency(e.amount)}</span>,
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (e) => <span className="text-sm text-gray-600">{e.date}</span>,
    },
    {
      key: 'notes',
      header: 'Notas',
      render: (e) => <span className="text-sm text-gray-600">{e.notes || '\u2014'}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (e) => (
        <RoleGuard section="savings-fund" action="delete">
          <button
            onClick={(ev) => { ev.stopPropagation(); handleDelete(e.name); }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </RoleGuard>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        employee: form.employee,
        employee_name: form.employee_name,
        entry_type: form.entry_type,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes,
      } as Partial<SavingsFundEntry>);
      toast.success('Movimiento registrado', 'El movimiento de fondo de ahorro se guard\u00f3 correctamente.');
      setShowNewModal(false);
      setForm({ employee: '', employee_name: '', entry_type: 'Aportaci\u00f3n', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Eliminado', 'El movimiento fue eliminado.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fondo de Ahorro</h1>
          <p className="mt-1 text-gray-500">Gesti\u00f3n de aportaciones, retiros y rendimientos del fondo de ahorro</p>
        </div>
        <RoleGuard section="savings-fund" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Movimiento
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Movimientos" value={entries?.length ?? 0} icon={PiggyBank} color="blue" />
        <StatsCard title="Total Aportaciones" value={formatCurrency(totalAportaciones)} icon={TrendingUp} color="green" />
        <StatsCard title="Total Retiros" value={formatCurrency(totalRetiros)} icon={TrendingDown} color="red" />
        <StatsCard title="Saldo" value={formatCurrency(saldo)} icon={DollarSign} color="purple" />
      </div>

      <DataTable
        columns={columns}
        data={entries ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay movimientos en el fondo de ahorro. Registra el primero desde el bot\u00f3n 'Nuevo Movimiento'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Movimiento"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employee || !form.amount} className="btn-primary">
              {createMutation.isPending ? 'Guardando...' : 'Registrar Movimiento'}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
              <select className="input" value={form.entry_type} onChange={(e) => setForm({ ...form, entry_type: e.target.value as SavingsFundEntry['entry_type'] })}>
                <option value="Aportaci&#243;n">Aportaci&#243;n</option>
                <option value="Retiro">Retiro</option>
                <option value="Rendimiento">Rendimiento</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monto</label>
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
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
