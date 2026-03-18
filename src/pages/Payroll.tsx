import { useState } from 'react';
import { DollarSign, FileText, Calculator, TrendingUp, Eye, Download, FileSpreadsheet } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PayslipDetailModal from '@/components/payroll/PayslipDetailModal';
import { useSalarySlips } from '@/hooks/useFrappe';
import { downloadSalarySlipPdf, downloadPayrollSummaryPdf } from '@/lib/pdf/pdfGenerator';
import { downloadPayrollExcel } from '@/lib/excel/excelGenerator';
import { toast } from '@/components/ui/Toast';
import type { SalarySlip } from '@/types/frappe';

export default function Payroll() {
  const { data: slips, isLoading } = useSalarySlips();
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const totalGross = slips?.reduce((sum, s) => sum + (s.gross_pay ?? 0), 0) ?? 0;
  const totalNet = slips?.reduce((sum, s) => sum + (s.net_pay ?? 0), 0) ?? 0;
  const totalDeductions = slips?.reduce((sum, s) => sum + (s.total_deduction ?? 0), 0) ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  const columns: Column<SalarySlip>[] = [
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
    {
      key: 'gross_pay',
      header: 'Bruto',
      render: (slip) => (
        <span className="font-medium">{formatCurrency(slip.gross_pay)}</span>
      ),
    },
    {
      key: 'total_deduction',
      header: 'Deducciones',
      render: (slip) => (
        <span className="text-red-600">{formatCurrency(slip.total_deduction)}</span>
      ),
    },
    {
      key: 'net_pay',
      header: 'Neto',
      render: (slip) => (
        <span className="font-bold text-green-600">{formatCurrency(slip.net_pay)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (slip) => <StatusBadge status={slip.status} />,
    },
    { key: 'posting_date', header: 'Fecha' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (slip) => (
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedSlip(slip)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => { try { downloadSalarySlipPdf(slip); } catch (err) { toast.fromError(err); } }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Descargar PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nómina</h1>
          <p className="mt-1 text-gray-500">Gestión de nómina y recibos de pago</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { try { if (slips) downloadPayrollExcel(slips); } catch (err) { toast.fromError(err); } }}
            disabled={!slips || slips.length === 0}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar Excel
          </button>
          <button
            onClick={() => { try { if (slips) downloadPayrollSummaryPdf(slips); } catch (err) { toast.fromError(err); } }}
            disabled={!slips || slips.length === 0}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Recibos Generados" value={slips?.length ?? 0} icon={FileText} color="blue" />
        <StatsCard title="Total Bruto" value={formatCurrency(totalGross)} icon={DollarSign} color="green" />
        <StatsCard title="Total Deducciones" value={formatCurrency(totalDeductions)} icon={Calculator} color="red" />
        <StatsCard title="Total Neto" value={formatCurrency(totalNet)} icon={TrendingUp} color="purple" />
      </div>

      <DataTable
        columns={columns}
        data={slips ?? []}
        isLoading={isLoading}
        emptyMessage="No hay recibos de nómina. Configura la nómina desde el módulo de Nómina."
      />

      <PayslipDetailModal slip={selectedSlip} onClose={() => setSelectedSlip(null)} />
    </div>
  );
}
