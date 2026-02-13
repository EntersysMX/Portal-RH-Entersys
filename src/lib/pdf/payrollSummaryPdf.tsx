import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, formatMXN } from './pdfStyles';
import { PdfHeader, PdfFooter, PdfSection, PdfTable, PdfKeyValue } from './pdfComponents';
import type { SalarySlip } from '@/types/frappe';

export function PayrollSummaryPdf({ slips }: { slips: SalarySlip[] }) {
  const totalGross = slips.reduce((s, sl) => s + sl.gross_pay, 0);
  const totalDed = slips.reduce((s, sl) => s + sl.total_deduction, 0);
  const totalNet = slips.reduce((s, sl) => s + sl.net_pay, 0);

  // Group by department
  const deptMap: Record<string, { gross: number; ded: number; net: number; count: number }> = {};
  slips.forEach((sl) => {
    const dept = sl.department || 'Sin departamento';
    if (!deptMap[dept]) deptMap[dept] = { gross: 0, ded: 0, net: 0, count: 0 };
    deptMap[dept].gross += sl.gross_pay;
    deptMap[dept].ded += sl.total_deduction;
    deptMap[dept].net += sl.net_pay;
    deptMap[dept].count++;
  });

  const deptSummary = Object.entries(deptMap).map(([dept, d]) => ({
    departamento: dept,
    empleados: String(d.count),
    bruto: formatMXN(d.gross),
    deducciones: formatMXN(d.ded),
    neto: formatMXN(d.net),
  }));

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        <PdfHeader subtitle="Resumen de Nómina" />

        <PdfSection title="Totales">
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <PdfKeyValue label="Total Recibos" value={String(slips.length)} />
              <PdfKeyValue label="Total Bruto" value={formatMXN(totalGross)} />
            </View>
            <View style={{ flex: 1 }}>
              <PdfKeyValue label="Total Deducciones" value={formatMXN(totalDed)} />
              <PdfKeyValue label="Total Neto" value={formatMXN(totalNet)} />
            </View>
          </View>
        </PdfSection>

        <PdfSection title="Detalle por Empleado">
          <PdfTable
            columns={[
              { header: 'Empleado', key: 'empleado', width: '30%' },
              { header: 'Departamento', key: 'departamento', width: '20%' },
              { header: 'Bruto', key: 'bruto', width: '17%', align: 'right' },
              { header: 'Deducciones', key: 'deducciones', width: '17%', align: 'right' },
              { header: 'Neto', key: 'neto', width: '16%', align: 'right' },
            ]}
            data={slips.map((sl) => ({
              empleado: sl.employee_name,
              departamento: sl.department || '—',
              bruto: formatMXN(sl.gross_pay),
              deducciones: formatMXN(sl.total_deduction),
              neto: formatMXN(sl.net_pay),
            }))}
          />
        </PdfSection>

        <PdfFooter />
      </Page>

      <Page size="LETTER" style={pdfStyles.page}>
        <PdfHeader subtitle="Resumen por Departamento" />

        <PdfSection title="Resumen por Departamento">
          <PdfTable
            columns={[
              { header: 'Departamento', key: 'departamento', width: '25%' },
              { header: 'Empleados', key: 'empleados', width: '15%', align: 'center' },
              { header: 'Bruto', key: 'bruto', width: '20%', align: 'right' },
              { header: 'Deducciones', key: 'deducciones', width: '20%', align: 'right' },
              { header: 'Neto', key: 'neto', width: '20%', align: 'right' },
            ]}
            data={deptSummary}
          />
        </PdfSection>

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
          <Text style={{ fontSize: 8, color: '#6b7280', textAlign: 'center' }}>
            Documento confidencial — Generado por EnterHR
          </Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
