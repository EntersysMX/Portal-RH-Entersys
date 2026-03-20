import { useState } from 'react';
import { Gift, Plus, Trash2, DollarSign, CheckCircle2, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useBenefitEntries, useCreateBenefitEntry, useDeleteBenefitEntry } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { BenefitEntry } from '@/types/frappe';

const BENEFIT_TYPES = [
  'Aguinaldo',
  'Prima Vacacional',
  'Vales de Despensa',
  'Seguro de Vida',
  'Seguro GMM',
  'Fondo de Ahorro',
  'Bono',
  'Otro',
] as const;

const BENEFIT_TYPE_STYLES: Record<BenefitEntry['benefit_type'], string> = {
  Aguinaldo: 'bg-green-100 text-green-700',
  'Prima Vacacional': 'bg-blue-100 text-blue-700',
  'Vales de Despensa': 'bg-purple-100 text-purple-700',
  'Seguro de Vida': 'bg-cyan-100 text-cyan-700',
  'Seguro GMM': 'bg-indigo-100 text-indigo-700',
  'Fondo de Ahorro': 'bg-orange-100 text-orange-700',
  Bono: 'bg-yellow-100 text-yellow-700',
  Otro: 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = {
  employee: '',
  employee_name: '',
  benefit_type: 'Aguinaldo' as BenefitEntry['benefit_type'],
  amount: 0,
  period: '',
  status: 'Active' as BenefitEntry['status'],
  notes: '',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export default function Benefits() {
  const { data: entries, isLoading, isError, refetch } = useBenefitEntries();
  const createMutation = useCreateBenefitEntry();
  const deleteMutation = useDeleteBenefitEntry();

  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const activeCount = entries?.filter((e) => e.status === 'Active').length ?? 0;
  const uniqueTypes = new Set(entries?.map((e) => e.benefit_type)).size;
  const totalAmount = entries?.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form as Partial<BenefitEntry>);
      toast.success('Prestación creada', 'El registro se guardó correctamente.');
      setShowNewModal(false);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Prestación eliminada', 'El registro fue eliminado.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  const columns: Column<BenefitEntry>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (e) => <p className="font-medium text-gray-900">{e.employee_name}</p>,
    },
    {
      key: 'benefit_type',
      header: 'Tipo de Prestación',
      render: (e) => (
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            BENEFIT_TYPE_STYLES[e.benefit_type]
          )}
        >
          {e.benefit_type}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (e) => <span className="font-medium">{formatCurrency(e.amount)}</span>,
    },
    {
      key: 'period',
      header: 'Periodo',
      render: (e) => <span className="text-gray-500">{e.period || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (e) => (
        <span
          className={clsx(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {e.status === 'Active' ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (e) => (
        <RoleGuard section="benefits" action="delete">
          <button
            onClick={() => handleDelete(e.name)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </RoleGuard>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestaciones</h1>
          <p className="mt-1 text-gray-500">Gestión de prestaciones y beneficios del personal</p>
        </div>
        <RoleGuard section="benefits" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Prestación
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Registros" value={entries?.length ?? 0} icon={Gift} color="blue" />
        <StatsCard title="Activas" value={activeCount} icon={CheckCircle2} color="green" />
        <StatsCard title="Tipos Únicos" value={uniqueTypes} icon={Tag} color="purple" />
        <StatsCard title="Monto Total" value={formatCurrency(totalAmount)} icon={DollarSign} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={entries ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay prestaciones registradas. Crea la primera desde el botón 'Nueva Prestación'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Prestación"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.employee || !form.employee_name || form.amount <= 0}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar Prestación'}
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del Empleado</label>
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Prestación</label>
              <select
                className="input"
                value={form.benefit_type}
                onChange={(e) => setForm({ ...form, benefit_type: e.target.value as BenefitEntry['benefit_type'] })}
              >
                {BENEFIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Periodo</label>
              <input
                className="input"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="Ej. 2026-Q1, Mensual, Anual"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BenefitEntry['status'] })}
              >
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas (opcional)</label>
            <textarea
              className="input min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales sobre la prestación..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
