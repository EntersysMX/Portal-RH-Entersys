import { useState } from 'react';
import { DollarSign, FileText, Calculator, TrendingUp, Eye, Download, FileSpreadsheet, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import PayslipDetailModal from '@/components/payroll/PayslipDetailModal';
import { useSalarySlips, useSalaryStructures, useAdditionalSalaries, useCreateAdditionalSalary } from '@/hooks/useFrappe';
import { downloadSalarySlipPdf, downloadPayrollSummaryPdf } from '@/lib/pdf/pdfGenerator';
import { downloadPayrollExcel } from '@/lib/excel/excelGenerator';
import { toast } from '@/components/ui/Toast';
import type { SalarySlip, SalaryStructure, AdditionalSalary } from '@/types/frappe';

type Tab = 'slips' | 'structures' | 'additional';

const TABS: { id: Tab; label: string }[] = [
  { id: 'slips', label: 'Recibos' },
  { id: 'structures', label: 'Estructura Salarial' },
  { id: 'additional', label: 'Salario Adicional' },
];

export default function Payroll() {
  const [activeTab, setActiveTab] = useState<Tab>('slips');
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);
  const [newAdditional, setNewAdditional] = useState({
    employee: '',
    salary_component: '',
    amount: 0,
    payroll_date: '',
    type: 'Earning' as 'Earning' | 'Deduction',
    company: '',
  });

  const { data: slips, isLoading, isError, refetch } = useSalarySlips();
  const { data: structures, isLoading: loadingStructures, isError: errorStructures, refetch: refetchStructures } = useSalaryStructures();
  const { data: additionals, isLoading: loadingAdditionals, isError: errorAdditionals, refetch: refetchAdditionals } = useAdditionalSalaries();
  const createAdditionalMutation = useCreateAdditionalSalary();

  const totalGross = slips?.reduce((sum, s) => sum + (s.gross_pay ?? 0), 0) ?? 0;
  const totalNet = slips?.reduce((sum, s) => sum + (s.net_pay ?? 0), 0) ?? 0;
  const totalDeductions = slips?.reduce((sum, s) => sum + (s.total_deduction ?? 0), 0) ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  const slipColumns: Column<SalarySlip>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (slip) => (
        <div>
          <p className="font-medium text-gray-900">{slip.employee_name}</p>
          <p className="text-xs text-gray-400">{slip.employee}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Departamento' },
    { key: 'designation', header: 'Puesto' },
    { key: 'gross_pay', header: 'Bruto', render: (slip) => <span className="font-medium">{formatCurrency(slip.gross_pay)}</span> },
    { key: 'total_deduction', header: 'Deducciones', render: (slip) => <span className="text-red-600">{formatCurrency(slip.total_deduction)}</span> },
    { key: 'net_pay', header: 'Neto', render: (slip) => <span className="font-bold text-green-600">{formatCurrency(slip.net_pay)}</span> },
    { key: 'status', header: 'Estado', render: (slip) => <StatusBadge status={slip.status} /> },
    { key: 'posting_date', header: 'Fecha' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (slip) => (
        <div className="flex gap-1">
          <button onClick={() => setSelectedSlip(slip)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Ver detalle"><Eye className="h-4 w-4" /></button>
          <button onClick={() => { try { downloadSalarySlipPdf(slip); } catch (err) { toast.fromError(err); } }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Descargar PDF"><Download className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const structureColumns: Column<SalaryStructure>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'company', header: 'Empresa' },
    { key: 'payroll_frequency', header: 'Frecuencia' },
    {
      key: 'is_active',
      header: 'Activa',
      render: (s) => s.is_active === 'Yes' || s.docstatus === 1
        ? <span className="badge-success">Sí</span>
        : <span className="text-gray-300">No</span>,
    },
  ];

  const additionalColumns: Column<AdditionalSalary>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (a) => (
        <div>
          <p className="font-medium text-gray-900">{a.employee_name}</p>
          <p className="text-xs text-gray-400">{a.employee}</p>
        </div>
      ),
    },
    { key: 'salary_component', header: 'Componente' },
    { key: 'amount', header: 'Monto', render: (a) => <span className="font-medium">{formatCurrency(a.amount)}</span> },
    { key: 'payroll_date', header: 'Fecha' },
    {
      key: 'type',
      header: 'Tipo',
      render: (a) => (
        <span className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          a.type === 'Earning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {a.type === 'Earning' ? 'Percepción' : 'Deducción'}
        </span>
      ),
    },
    { key: 'company', header: 'Empresa' },
  ];

  const handleCreateAdditional = async () => {
    try {
      await createAdditionalMutation.mutateAsync(newAdditional as Partial<AdditionalSalary>);
      toast.success('Salario adicional creado', 'El registro se creó correctamente.');
      setShowAdditionalModal(false);
      setNewAdditional({ employee: '', salary_component: '', amount: 0, payroll_date: '', type: 'Earning', company: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nómina</h1>
          <p className="mt-1 text-gray-500">Gestión de nómina y recibos de pago</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'slips' && (
            <>
              <button onClick={() => { try { if (slips) downloadPayrollExcel(slips); } catch (err) { toast.fromError(err); } }} disabled={!slips || slips.length === 0} className="btn-secondary">
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </button>
              <button onClick={() => { try { if (slips) downloadPayrollSummaryPdf(slips); } catch (err) { toast.fromError(err); } }} disabled={!slips || slips.length === 0} className="btn-secondary">
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </>
          )}
          {activeTab === 'additional' && (
            <RoleGuard section="payroll" action="create">
              <button onClick={() => setShowAdditionalModal(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nuevo Salario Adicional
              </button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Recibos Generados" value={slips?.length ?? 0} icon={FileText} color="blue" />
        <StatsCard title="Total Bruto" value={formatCurrency(totalGross)} icon={DollarSign} color="green" />
        <StatsCard title="Total Deducciones" value={formatCurrency(totalDeductions)} icon={Calculator} color="red" />
        <StatsCard title="Total Neto" value={formatCurrency(totalNet)} icon={TrendingUp} color="purple" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {TABS.map((tab) => (
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

      {activeTab === 'slips' && (
        <>
          <DataTable<SalarySlip>
            columns={slipColumns}
            data={slips ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyMessage="No hay recibos de nómina."
          />
          <PayslipDetailModal slip={selectedSlip} onClose={() => setSelectedSlip(null)} />
        </>
      )}

      {activeTab === 'structures' && (
        <DataTable<SalaryStructure>
          columns={structureColumns}
          data={structures ?? []}
          isLoading={loadingStructures}
          isError={errorStructures}
          onRetry={refetchStructures}
          emptyMessage="No hay estructuras salariales configuradas"
        />
      )}

      {activeTab === 'additional' && (
        <DataTable<AdditionalSalary>
          columns={additionalColumns}
          data={additionals ?? []}
          isLoading={loadingAdditionals}
          isError={errorAdditionals}
          onRetry={refetchAdditionals}
          emptyMessage="No hay salarios adicionales registrados"
        />
      )}

      {/* New Additional Salary Modal */}
      <Modal
        isOpen={showAdditionalModal}
        onClose={() => setShowAdditionalModal(false)}
        title="Nuevo Salario Adicional"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowAdditionalModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateAdditional} disabled={createAdditionalMutation.isPending || !newAdditional.employee || !newAdditional.salary_component} className="btn-primary">
              {createAdditionalMutation.isPending ? 'Creando...' : 'Crear Registro'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empleado (ID)</label>
              <input className="input" placeholder="HR-EMP-00001" value={newAdditional.employee} onChange={(e) => setNewAdditional({ ...newAdditional, employee: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Componente Salarial</label>
              <input className="input" placeholder="Ej: Bono, Comisiones" value={newAdditional.salary_component} onChange={(e) => setNewAdditional({ ...newAdditional, salary_component: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monto</label>
              <input type="number" className="input" value={newAdditional.amount || ''} onChange={(e) => setNewAdditional({ ...newAdditional, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
              <select className="input" value={newAdditional.type} onChange={(e) => setNewAdditional({ ...newAdditional, type: e.target.value as 'Earning' | 'Deduction' })}>
                <option value="Earning">Percepción</option>
                <option value="Deduction">Deducción</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Nómina</label>
              <input type="date" className="input" value={newAdditional.payroll_date} onChange={(e) => setNewAdditional({ ...newAdditional, payroll_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
              <input className="input" value={newAdditional.company} onChange={(e) => setNewAdditional({ ...newAdditional, company: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
