import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { SalarySlipPdf } from './salarySlipPdf';
import { EmployeeReportPdf } from './employeeReportPdf';
import { PayrollSummaryPdf } from './payrollSummaryPdf';
import type { SalarySlip, Employee } from '@/types/frappe';

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPdf(component: React.ComponentType<any>, props: Record<string, unknown>) {
  return pdf(createElement(component, props) as any).toBlob();
}

export async function downloadSalarySlipPdf(slip: SalarySlip): Promise<void> {
  const blob = await renderPdf(SalarySlipPdf, { slip });
  const filename = `Recibo_${slip.employee_name.replace(/\s+/g, '_')}_${slip.start_date}_${slip.end_date}.pdf`;
  await triggerDownload(blob, filename);
}

export async function downloadEmployeeReportPdf(
  employee: Employee,
  slips?: SalarySlip[]
): Promise<void> {
  const blob = await renderPdf(EmployeeReportPdf, { employee, slips });
  const filename = `Ficha_${employee.employee_name.replace(/\s+/g, '_')}.pdf`;
  await triggerDownload(blob, filename);
}

export async function downloadPayrollSummaryPdf(slips: SalarySlip[]): Promise<void> {
  const blob = await renderPdf(PayrollSummaryPdf, { slips });
  const period = slips[0] ? `${slips[0].start_date}_${slips[0].end_date}` : 'resumen';
  const filename = `Resumen_Nomina_${period}.pdf`;
  await triggerDownload(blob, filename);
}
