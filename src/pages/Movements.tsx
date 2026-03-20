import { useState } from 'react';
import { Plus, TrendingUp, ArrowLeftRight, ArrowUpDown, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { toast } from '@/components/ui/Toast';
import { usePromotions, useTransfers, useCreatePromotion, useCreateTransfer } from '@/hooks/useFrappe';
import type { EmployeePromotion, EmployeeTransfer } from '@/types/frappe';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

function formatDetails(details: { property: string; current: string; new: string }[]): string {
  if (!details || details.length === 0) return '-';
  return details.map((d) => `${d.property}: ${d.current} \u2192 ${d.new}`).join(', ');
}

const currentYear = new Date().getFullYear();

export default function Movements() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'transfers'>('promotions');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [newPromotion, setNewPromotion] = useState({
    employee: '',
    promotion_date: '',
    property: '',
    current: '',
    new_value: '',
    revised_ctc: '',
  });

  const [newTransfer, setNewTransfer] = useState({
    employee: '',
    transfer_date: '',
    property: '',
    current: '',
    new_value: '',
  });

  const { data: promotions, isLoading: loadingPromotions, isError: errorPromotions, refetch: refetchPromotions } = usePromotions();
  const { data: transfers, isLoading: loadingTransfers, isError: errorTransfers, refetch: refetchTransfers } = useTransfers();
  const createPromotionMutation = useCreatePromotion();
  const createTransferMutation = useCreateTransfer();

  const totalPromotions = promotions?.length ?? 0;
  const totalTransfers = transfers?.length ?? 0;
  const totalMovements = totalPromotions + totalTransfers;
  const thisYearCount =
    (promotions?.filter((p) => p.promotion_date?.startsWith(String(currentYear))).length ?? 0) +
    (transfers?.filter((t) => t.transfer_date?.startsWith(String(currentYear))).length ?? 0);

  const promotionColumns: Column<EmployeePromotion>[] = [
    { key: 'employee_name', header: 'Empleado' },
    { key: 'promotion_date', header: 'Fecha' },
    {
      key: 'promotion_details',
      header: 'Detalles',
      render: (item) => formatDetails(item.promotion_details),
    },
    {
      key: 'revised_ctc',
      header: 'CTC Revisado',
      render: (item) => (item.revised_ctc ? formatCurrency(item.revised_ctc) : '-'),
    },
  ];

  const transferColumns: Column<EmployeeTransfer>[] = [
    { key: 'employee_name', header: 'Empleado' },
    { key: 'transfer_date', header: 'Fecha' },
    {
      key: 'transfer_details',
      header: 'Detalles',
      render: (item) => formatDetails(item.transfer_details),
    },
  ];

  const handleCreatePromotion = async () => {
    try {
      await createPromotionMutation.mutateAsync({
        employee: newPromotion.employee,
        promotion_date: newPromotion.promotion_date,
        promotion_details: [
          {
            property: newPromotion.property,
            current: newPromotion.current,
            new: newPromotion.new_value,
          },
        ],
        revised_ctc: newPromotion.revised_ctc ? Number(newPromotion.revised_ctc) : undefined,
      });
      toast.success('Promocion creada', 'La promocion se registro correctamente.');
      setShowPromotionModal(false);
      setNewPromotion({ employee: '', promotion_date: '', property: '', current: '', new_value: '', revised_ctc: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleCreateTransfer = async () => {
    try {
      await createTransferMutation.mutateAsync({
        employee: newTransfer.employee,
        transfer_date: newTransfer.transfer_date,
        transfer_details: [
          {
            property: newTransfer.property,
            current: newTransfer.current,
            new: newTransfer.new_value,
          },
        ],
      });
      toast.success('Transferencia creada', 'La transferencia se registro correctamente.');
      setShowTransferModal(false);
      setNewTransfer({ employee: '', transfer_date: '', property: '', current: '', new_value: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          <p className="mt-1 text-gray-500">Promociones y transferencias de empleados</p>
        </div>
        <div className="flex gap-2">
          <RoleGuard section="movements" action="create">
            <button onClick={() => setShowPromotionModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nueva Promocion
            </button>
          </RoleGuard>
          <RoleGuard section="movements" action="create">
            <button onClick={() => setShowTransferModal(true)} className="btn-secondary">
              <Plus className="h-4 w-4" />
              Nueva Transferencia
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Promociones" value={totalPromotions} icon={TrendingUp} color="blue" />
        <StatsCard title="Total Transferencias" value={totalTransfers} icon={ArrowLeftRight} color="purple" />
        <StatsCard title="Total Movimientos" value={totalMovements} icon={ArrowUpDown} color="green" />
        <StatsCard title="Este Ano" value={thisYearCount} icon={Calendar} color="orange" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'promotions' as const, label: 'Promociones' },
            { id: 'transfers' as const, label: 'Transferencias' },
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

      {/* Promotions Table */}
      {activeTab === 'promotions' && (
        <DataTable<EmployeePromotion>
          columns={promotionColumns}
          data={promotions ?? []}
          isLoading={loadingPromotions}
          isError={errorPromotions}
          onRetry={refetchPromotions}
          emptyMessage="No hay promociones registradas"
        />
      )}

      {/* Transfers Table */}
      {activeTab === 'transfers' && (
        <DataTable<EmployeeTransfer>
          columns={transferColumns}
          data={transfers ?? []}
          isLoading={loadingTransfers}
          isError={errorTransfers}
          onRetry={refetchTransfers}
          emptyMessage="No hay transferencias registradas"
        />
      )}

      {/* New Promotion Modal */}
      <Modal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        title="Nueva Promocion"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowPromotionModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreatePromotion}
              disabled={createPromotionMutation.isPending}
              className="btn-primary"
            >
              {createPromotionMutation.isPending ? 'Creando...' : 'Crear Promocion'}
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
                value={newPromotion.employee}
                onChange={(e) => setNewPromotion({ ...newPromotion, employee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Promocion</label>
              <input
                type="date"
                className="input"
                value={newPromotion.promotion_date}
                onChange={(e) => setNewPromotion({ ...newPromotion, promotion_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Propiedad</label>
              <input
                className="input"
                placeholder="Designation"
                value={newPromotion.property}
                onChange={(e) => setNewPromotion({ ...newPromotion, property: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor Actual</label>
              <input
                className="input"
                placeholder="Analista"
                value={newPromotion.current}
                onChange={(e) => setNewPromotion({ ...newPromotion, current: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nuevo Valor</label>
              <input
                className="input"
                placeholder="Gerente"
                value={newPromotion.new_value}
                onChange={(e) => setNewPromotion({ ...newPromotion, new_value: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTC Revisado</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={newPromotion.revised_ctc}
                onChange={(e) => setNewPromotion({ ...newPromotion, revised_ctc: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* New Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Nueva Transferencia"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowTransferModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreateTransfer}
              disabled={createTransferMutation.isPending}
              className="btn-primary"
            >
              {createTransferMutation.isPending ? 'Creando...' : 'Crear Transferencia'}
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
                value={newTransfer.employee}
                onChange={(e) => setNewTransfer({ ...newTransfer, employee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Transferencia</label>
              <input
                type="date"
                className="input"
                value={newTransfer.transfer_date}
                onChange={(e) => setNewTransfer({ ...newTransfer, transfer_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Propiedad</label>
              <input
                className="input"
                placeholder="Department"
                value={newTransfer.property}
                onChange={(e) => setNewTransfer({ ...newTransfer, property: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor Actual</label>
              <input
                className="input"
                placeholder="Ventas"
                value={newTransfer.current}
                onChange={(e) => setNewTransfer({ ...newTransfer, current: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nuevo Valor</label>
              <input
                className="input"
                placeholder="Marketing"
                value={newTransfer.new_value}
                onChange={(e) => setNewTransfer({ ...newTransfer, new_value: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
