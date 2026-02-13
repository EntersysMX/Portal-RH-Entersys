import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, COLORS } from './pdfStyles';

export function PdfHeader({ subtitle, date }: { subtitle: string; date?: string }) {
  return (
    <View style={pdfStyles.headerBar}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={pdfStyles.logoBox}>
          <Text style={pdfStyles.logoText}>EnterHR</Text>
        </View>
        <Text style={pdfStyles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={pdfStyles.dateText}>{date || new Date().toLocaleDateString('es-MX')}</Text>
    </View>
  );
}

export function PdfFooter() {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>Generado por EnterHR</Text>
      <Text style={pdfStyles.footerText}>
        {new Date().toLocaleString('es-MX')}
      </Text>
      <Text
        style={pdfStyles.footerText}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

interface TableColumn {
  header: string;
  key: string;
  width: string;
  align?: 'left' | 'right' | 'center';
}

export function PdfTable({
  columns,
  data,
  headerStyle,
}: {
  columns: TableColumn[];
  data: Record<string, string | number>[];
  headerStyle?: 'green' | 'red' | 'default';
}) {
  const headerStyleMap = {
    green: pdfStyles.tableHeaderGreen,
    red: pdfStyles.tableHeaderRed,
    default: pdfStyles.tableHeader,
  };

  return (
    <View style={pdfStyles.table}>
      <View style={headerStyleMap[headerStyle || 'default']}>
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[
              pdfStyles.tableCellBold,
              { width: col.width, textAlign: col.align || 'left' },
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>
      {data.map((row, idx) => (
        <View key={idx} style={pdfStyles.tableRow}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                pdfStyles.tableCell,
                { width: col.width, textAlign: col.align || 'left' },
              ]}
            >
              {String(row[col.key] ?? '')}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PdfKeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.row}>
      <Text style={pdfStyles.label}>{label}</Text>
      <Text style={pdfStyles.value}>{value}</Text>
    </View>
  );
}

export function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={pdfStyles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 3, height: 14, backgroundColor: COLORS.primary, marginRight: 6, borderRadius: 2 }} />
        <Text style={[pdfStyles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
