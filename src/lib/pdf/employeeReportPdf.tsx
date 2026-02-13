import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, formatMXN, formatDate } from './pdfStyles';
import { PdfHeader, PdfFooter, PdfKeyValue, PdfSection, PdfTable } from './pdfComponents';
import type { Employee, SalarySlip } from '@/types/frappe';

export function EmployeeReportPdf({
  employee,
  slips = [],
}: {
  employee: Employee;
  slips?: SalarySlip[];
}) {
  const recentSlips = slips.slice(0, 3);

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        <PdfHeader subtitle="Ficha de Empleado" />

        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <PdfSection title="Datos Personales">
              <PdfKeyValue label="Nombre" value={employee.employee_name} />
              <PdfKeyValue label="ID" value={employee.name} />
              <PdfKeyValue label="Género" value={employee.gender || '—'} />
              <PdfKeyValue label="Nacimiento" value={formatDate(employee.date_of_birth)} />
              <PdfKeyValue label="RFC" value={employee.rfc || '—'} />
              <PdfKeyValue label="CURP" value={employee.curp || '—'} />
              <PdfKeyValue label="NSS" value={employee.nss || '—'} />
              <PdfKeyValue label="Estado Civil" value={employee.marital_status || '—'} />
            </PdfSection>
          </View>
          <View style={{ flex: 1 }}>
            <PdfSection title="Datos Laborales">
              <PdfKeyValue label="Empresa" value={employee.company} />
              <PdfKeyValue label="Departamento" value={employee.department} />
              <PdfKeyValue label="Puesto" value={employee.designation} />
              <PdfKeyValue label="Sucursal" value={employee.branch || '—'} />
              <PdfKeyValue label="Ingreso" value={formatDate(employee.date_of_joining)} />
              <PdfKeyValue label="Tipo" value={employee.employment_type || '—'} />
              <PdfKeyValue label="Status" value={employee.status} />
              <PdfKeyValue label="Reporta a" value={employee.reports_to || '—'} />
            </PdfSection>
          </View>
        </View>

        <PdfSection title="Contacto">
          <PdfKeyValue label="Teléfono" value={employee.cell_phone || '—'} />
          <PdfKeyValue label="Email Personal" value={employee.personal_email || '—'} />
          <PdfKeyValue label="Email Corporativo" value={employee.company_email || '—'} />
          <PdfKeyValue label="Dirección" value={employee.current_address || '—'} />
        </PdfSection>

        {recentSlips.length > 0 && (
          <PdfSection title="Últimos Recibos de Nómina">
            <PdfTable
              columns={[
                { header: 'Período', key: 'periodo', width: '30%' },
                { header: 'Bruto', key: 'bruto', width: '23%', align: 'right' },
                { header: 'Deducciones', key: 'deducciones', width: '23%', align: 'right' },
                { header: 'Neto', key: 'neto', width: '24%', align: 'right' },
              ]}
              data={recentSlips.map((s) => ({
                periodo: `${s.start_date} - ${s.end_date}`,
                bruto: formatMXN(s.gross_pay),
                deducciones: formatMXN(s.total_deduction),
                neto: formatMXN(s.net_pay),
              }))}
            />
          </PdfSection>
        )}

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
          <Text style={{ fontSize: 8, color: '#6b7280', textAlign: 'center' }}>
            Este documento es confidencial y para uso exclusivo de la empresa.
          </Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
