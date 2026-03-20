import { useState } from 'react';
import { Landmark, Plus, CheckCircle, DollarSign, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useLoans, useCreateLoan } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Loan } from '@/types/frappe';

const STATUS_STYLES: Record<Loan['status'], { bg: string; text: string }> = {
  Sanctioned: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Disbursed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Partially Disbursed': { bg: 'bg-purple-100', text: 'text-purple-700' },
  Repaid: { bg: 'bg-green-100', text: 'text-green-700' },
  Closed: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

function StatusBadge({ status }: { status: Loan['status'] }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', style.bg, style.text)}>
      {status}
    </span>
  );
}

function formatMXN(value: number) {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function Loans() {
  const { data: loans, isLoading, isError, refetch } = useLoans();
  const createMutation = useCreateLoan();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    applicant: '',
    loan_type: '',
    loan_amount: 0,
    rate_of_interest: 0,
    repayment_periods: 12,
    monthly_repayment_amount: 0,
    company: '',
    posting_date: new Date().toISOString().split('T')[0],
    disbursement_date: '',
    repayment_start_date: '',
  });

  const activeLoans = loans?.filter((l) => l.status === 'Disbursed' || l.status === 'Sanctioned') || [];
  const totalAmount = loans?.reduce((sum, l) => sum + l.loan_amount, 0) ?? 0;
  const totalPaid = loans?.reduce((sum, l) => sum + l.total_amount_paid, 0) ?? 0;

  const columns: Column<Loan>[] = [
    {
      key: 'applicant_name',
      header: 'Solicitante',
      render: (l) => <p className="font-medium text-gray-900">{l.applicant_name}</p>,
    },
    {
      key: 'loan_type',
      header: 'Tipo',
    },
    {
      key: 'loan_amount',
      header: 'Monto',
      render: (l) => <span className="font-medium">{formatMXN(l.loan_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'monthly_repayment_amount',
      header: 'Pago Mensual',
      render: (l) => <span>{formatMXN(l.monthly_repayment_amount)}</span>,
    },
    {
      key: 'posting_date',
      header: 'Fecha',
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...newLoan,
        status: 'Sanctioned',
        total_payment: 0,
        total_amount_paid: 0,
      } as Partial<Loan>);
      toast.success('Préstamo creado', 'El préstamo se registró correctamente.');
      setShowNewModal(false);
      setNewLoan({
        applicant: '',
        loan_type: '',
        loan_amount: 0,
        rate_of_interest: 0,
        repayment_periods: 12,
        monthly_repayment_amount: 0,
        company: '',
        posting_date: new Date().toISOString().split('T')[0],
        disbursement_date: '',
        repayment_start_date: '',
      });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Préstamos</h1>
          <p className="mt-1 text-gray-500">Gestión de préstamos a empleados</p>
        </div>
        <RoleGuard section="loans" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Préstamo
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Préstamos" value={loans?.length ?? 0} icon={Landmark} color="blue" />
        <StatsCard title="Activos" value={activeLoans.length} icon={CheckCircle} color="green" />
        <StatsCard title="Monto Total" value={formatMXN(totalAmount)} icon={DollarSign} color="purple" />
        <StatsCard title="Pagado Total" value={formatMXN(totalPaid)} icon={CreditCard} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={loans ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay préstamos registrados. Crea el primero desde el botón 'Nuevo Préstamo'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Préstamo"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !newLoan.applicant || !newLoan.loan_type} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Registrar Préstamo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Solicitante (ID Empleado)</label>
              <input className="input" value={newLoan.applicant} onChange={(e) => setNewLoan({ ...newLoan, applicant: e.target.value })} placeholder="HR-EMP-00001" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Préstamo</label>
              <input className="input" value={newLoan.loan_type} onChange={(e) => setNewLoan({ ...newLoan, loan_type: e.target.value })} placeholder="Ej: Personal, Vivienda" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monto del Préstamo</label>
              <input type="number" className="input" value={newLoan.loan_amount || ''} onChange={(e) => setNewLoan({ ...newLoan, loan_amount: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tasa de Interés (%)</label>
              <input type="number" className="input" value={newLoan.rate_of_interest || ''} onChange={(e) => setNewLoan({ ...newLoan, rate_of_interest: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Períodos de Pago</label>
              <input type="number" className="input" value={newLoan.repayment_periods} onChange={(e) => setNewLoan({ ...newLoan, repayment_periods: Number(e.target.value) })} placeholder="12" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Pago Mensual</label>
              <input type="number" className="input" value={newLoan.monthly_repayment_amount || ''} onChange={(e) => setNewLoan({ ...newLoan, monthly_repayment_amount: Number(e.target.value) })} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
            <input className="input" value={newLoan.company} onChange={(e) => setNewLoan({ ...newLoan, company: e.target.value })} placeholder="Nombre de la empresa" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Registro</label>
              <input type="date" className="input" value={newLoan.posting_date} onChange={(e) => setNewLoan({ ...newLoan, posting_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Desembolso</label>
              <input type="date" className="input" value={newLoan.disbursement_date} onChange={(e) => setNewLoan({ ...newLoan, disbursement_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Inicio de Pagos</label>
              <input type="date" className="input" value={newLoan.repayment_start_date} onChange={(e) => setNewLoan({ ...newLoan, repayment_start_date: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
