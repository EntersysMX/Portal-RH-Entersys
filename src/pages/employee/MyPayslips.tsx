import { useState } from 'react';
import { Download, Eye, FileText, FileSpreadsheet } from 'lucide-react';
import { useMySalarySlips } from '@/hooks/useFrappe';
import StatusBadge from '@/components/ui/StatusBadge';
import PayslipDetailModal from '@/components/payroll/PayslipDetailModal';
import { downloadSalarySlipPdf } from '@/lib/pdf/pdfGenerator';
import { downloadPayrollExcel } from '@/lib/excel/excelGenerator';
import { useAuthStore } from '@/store/authStore';
import type { SalarySlip } from '@/types/frappe';

export default function MyPayslips() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: slips, isLoading } = useMySalarySlips(pageSize, (page - 1) * pageSize);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Recibos de Nómina</h1>
          <p className="mt-1 text-gray-500">
            Historial de recibos de nómina de {user?.employee_name || user?.full_name}
          </p>
        </div>
        {slips && slips.length > 0 && (
          <button
            onClick={() => downloadPayrollExcel(slips)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar Excel
          </button>
        )}
      </div>

      {/* Summary cards */}
      {slips && slips.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Último neto</p>
            <p className="text-2xl font-bold text-green-600">
              ${slips[0].net_pay?.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Último bruto</p>
            <p className="text-2xl font-bold text-gray-900">
              ${slips[0].gross_pay?.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Última deducción</p>
            <p className="text-2xl font-bold text-red-500">
              ${slips[0].total_deduction?.toLocaleString('es-MX')}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : slips && slips.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Fecha</th>
                  <th>Bruto</th>
                  <th>Deducciones</th>
                  <th>Neto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr key={slip.name}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{slip.start_date}</p>
                        <p className="text-xs text-gray-400">a {slip.end_date}</p>
                      </div>
                    </td>
                    <td className="text-gray-600">{slip.posting_date}</td>
                    <td className="font-medium text-gray-900">
                      ${slip.gross_pay?.toLocaleString('es-MX')}
                    </td>
                    <td className="text-red-500">
                      -${slip.total_deduction?.toLocaleString('es-MX')}
                    </td>
                    <td className="font-semibold text-green-600">
                      ${slip.net_pay?.toLocaleString('es-MX')}
                    </td>
                    <td>
                      <StatusBadge status={slip.status} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedSlip(slip)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadSalarySlipPdf(slip)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin recibos</h3>
            <p className="mt-2 text-gray-500">
              No se encontraron recibos de nómina para tu cuenta.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {slips && slips.length >= pageSize && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">Página {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={slips.length < pageSize}
            className="btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Payslip Detail Modal */}
      <PayslipDetailModal slip={selectedSlip} onClose={() => setSelectedSlip(null)} />
    </div>
  );
}
