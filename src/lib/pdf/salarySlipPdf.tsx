import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, formatMXN, formatDate } from './pdfStyles';
import { PdfHeader, PdfFooter, PdfTable, PdfKeyValue, PdfSection } from './pdfComponents';
import type { SalarySlip } from '@/types/frappe';

function generateBreakdown(total: number, type: 'earnings' | 'deductions') {
  if (type === 'earnings') {
    const base = Math.round(total * 0.70);
    const bonus = Math.round(total * 0.15);
    const other = total - base - bonus;
    return [
      { concepto: 'Sueldo Base', importe: formatMXN(base) },
      { concepto: 'Bono de Productividad', importe: formatMXN(bonus) },
      { concepto: 'Otros Ingresos', importe: formatMXN(other) },
    ];
  }
  const isr = Math.round(total * 0.60);
  const imss = Math.round(total * 0.30);
  const other = total - isr - imss;
  return [
    { concepto: 'ISR', importe: formatMXN(isr) },
    { concepto: 'IMSS', importe: formatMXN(imss) },
    { concepto: 'Otras Deducciones', importe: formatMXN(other) },
  ];
}

export function SalarySlipPdf({ slip }: { slip: SalarySlip }) {
  const earnings = generateBreakdown(slip.gross_pay, 'earnings');
  const deductions = generateBreakdown(slip.total_deduction, 'deductions');

  const cols = [
    { header: 'Concepto', key: 'concepto', width: '70%' },
    { header: 'Importe', key: 'importe', width: '30%', align: 'right' as const },
  ];

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        <PdfHeader subtitle="Recibo de Nómina" />

        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <PdfSection title="Datos del Empleado">
              <PdfKeyValue label="Nombre" value={slip.employee_name} />
              <PdfKeyValue label="ID Empleado" value={slip.employee} />
              <PdfKeyValue label="Departamento" value={slip.department || '—'} />
              <PdfKeyValue label="Puesto" value={slip.designation || '—'} />
            </PdfSection>
          </View>
          <View style={{ flex: 1 }}>
            <PdfSection title="Datos del Período">
              <PdfKeyValue label="Período" value={`${formatDate(slip.start_date)} - ${formatDate(slip.end_date)}`} />
              <PdfKeyValue label="Fecha emisión" value={formatDate(slip.posting_date)} />
              <PdfKeyValue label="Empresa" value={slip.company || '—'} />
              <PdfKeyValue label="Folio" value={slip.name} />
            </PdfSection>
          </View>
        </View>

        <PdfSection title="Percepciones">
          <PdfTable columns={cols} data={earnings} headerStyle="green" />
          <View style={[pdfStyles.row, { justifyContent: 'flex-end', marginTop: 4 }]}>
            <Text style={[pdfStyles.tableCellBold, { color: '#16a34a' }]}>
              Total Percepciones: {formatMXN(slip.gross_pay)}
            </Text>
          </View>
        </PdfSection>

        <PdfSection title="Deducciones">
          <PdfTable columns={cols} data={deductions} headerStyle="red" />
          <View style={[pdfStyles.row, { justifyContent: 'flex-end', marginTop: 4 }]}>
            <Text style={[pdfStyles.tableCellBold, { color: '#dc2626' }]}>
              Total Deducciones: {formatMXN(slip.total_deduction)}
            </Text>
          </View>
        </PdfSection>

        <View style={pdfStyles.netPayBox}>
          <Text style={pdfStyles.netPayLabel}>Neto a Pagar</Text>
          <Text style={pdfStyles.netPayValue}>{formatMXN(slip.net_pay)}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
