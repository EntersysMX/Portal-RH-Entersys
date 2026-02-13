import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.gray900,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  logoBox: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray700,
    fontFamily: 'Helvetica-Bold',
  },
  dateText: {
    fontSize: 8,
    color: COLORS.gray500,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: COLORS.gray500,
  },
  value: {
    width: '60%',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tableHeaderGreen: {
    flexDirection: 'row',
    backgroundColor: '#dcfce7',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  tableHeaderRed: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.gray700,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray500,
  },
  netPayBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: 10,
    color: COLORS.success,
    marginBottom: 2,
  },
  netPayValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.success,
  },
});

export function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}
