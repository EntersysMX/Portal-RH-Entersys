import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { downloadSalarySlipPdf } from '@/lib/pdf/pdfGenerator';
import type { SalarySlip } from '@/types/frappe';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

function generateBreakdown(total: number, type: 'earnings' | 'deductions') {
  if (type === 'earnings') {
    const base = Math.round(total * 0.70);
    const bonus = Math.round(total * 0.15);
    const other = total - base - bonus;
    return [
      { concepto: 'Sueldo Base', importe: base },
      { concepto: 'Bono de Productividad', importe: bonus },
      { concepto: 'Otros Ingresos', importe: other },
    ];
  }
  const isr = Math.round(total * 0.60);
  const imss = Math.round(total * 0.30);
  const other = total - isr - imss;
  return [
    { concepto: 'ISR', importe: isr },
    { concepto: 'IMSS', importe: imss },
    { concepto: 'Otras Deducciones', importe: other },
  ];
}

export default function PayslipDetailModal({
  slip,
  onClose,
}: {
  slip: SalarySlip | null;
  onClose: () => void;
}) {
  if (!slip) return null;

  const earnings = generateBreakdown(slip.gross_pay, 'earnings');
  const deductions = generateBreakdown(slip.total_deduction, 'deductions');

  return (
    <Modal
      isOpen={!!slip}
      onClose={onClose}
      title="Detalle de Recibo de Nómina"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
          <button
            onClick={() => downloadSalarySlipPdf(slip)}
            className="btn-primary"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Empleado</p>
            <p className="font-semibold text-gray-900">{slip.employee_name}</p>
            <p className="text-xs text-gray-400">{slip.employee}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Período</p>
            <p className="font-semibold text-gray-900">{slip.start_date} — {slip.end_date}</p>
            <p className="text-xs text-gray-400">Emitido: {slip.posting_date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Departamento</p>
            <p className="font-medium text-gray-900">{slip.department || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <StatusBadge status={slip.status} />
          </div>
        </div>

        {/* Earnings */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Percepciones
          </h4>
          <table className="w-full">
            <thead>
              <tr className="bg-green-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-green-700">Concepto</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-green-700">Importe</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.concepto} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-700">{e.concepto}</td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(e.importe)}</td>
                </tr>
              ))}
              <tr className="bg-green-50">
                <td className="px-3 py-2 text-sm font-bold text-green-700">Total Percepciones</td>
                <td className="px-3 py-2 text-right text-sm font-bold text-green-700">{formatCurrency(slip.gross_pay)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Deducciones
          </h4>
          <table className="w-full">
            <thead>
              <tr className="bg-red-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-red-700">Concepto</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-red-700">Importe</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d) => (
                <tr key={d.concepto} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-700">{d.concepto}</td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(d.importe)}</td>
                </tr>
              ))}
              <tr className="bg-red-50">
                <td className="px-3 py-2 text-sm font-bold text-red-700">Total Deducciones</td>
                <td className="px-3 py-2 text-right text-sm font-bold text-red-700">{formatCurrency(slip.total_deduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Pay */}
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-sm text-green-600">Neto a Pagar</p>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(slip.net_pay)}</p>
        </div>
      </div>
    </Modal>
  );
}
