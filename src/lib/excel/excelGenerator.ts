// ============================================
// GENERADOR DE EXCEL CON BRANDING ENTERHR
// Formato profesional para nómina y proyecciones
// ============================================

import ExcelJS from 'exceljs';
import type { ProyeccionNomina, ReciboNomina, PrestacionesAnuales } from '@/modules/nomina-mx/types';
import type { SalarySlip } from '@/types/frappe';

// ---- Constantes de branding ----
const BRAND = {
  primary: '2563EB',     // EnterHR blue
  primaryDark: '1E40AF',
  accent: '7C3AED',      // Purple
  green: '16A34A',
  red: 'DC2626',
  orange: 'EA580C',
  headerBg: '1E3A5F',
  headerText: 'FFFFFF',
  sectionBg: 'EFF6FF',
  altRow: 'F8FAFC',
  border: 'CBD5E1',
  lightGreen: 'F0FDF4',
  lightRed: 'FEF2F2',
  lightPurple: 'F5F3FF',
};

const formatMXN = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const today = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

// ---- Helpers ----

function applyBrandHeader(ws: ExcelJS.Worksheet, title: string, subtitle: string, colCount: number) {
  // Row 1: EnterHR logo bar
  ws.mergeCells(1, 1, 1, colCount);
  const logoCell = ws.getCell('A1');
  logoCell.value = 'EnterHR by EnterSys';
  logoCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: BRAND.headerText } };
  logoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerBg } };
  logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  // Row 2: title
  ws.mergeCells(2, 1, 2, colCount);
  const titleCell = ws.getCell('A2');
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: BRAND.primary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  // Row 3: subtitle + date
  ws.mergeCells(3, 1, 3, colCount);
  const subCell = ws.getCell('A3');
  subCell.value = `${subtitle}  |  Generado: ${today()}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 22;

  // Row 4: empty spacer
  ws.getRow(4).height = 8;
}

function styleDataHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: BRAND.primaryDark } },
    };
  });
  row.height = 28;
}

function styleDataRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number, moneyColumns: number[] = []) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const isAlt = (r - startRow) % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.altRow } };
      }
      cell.border = {
        bottom: { style: 'hair', color: { argb: BRAND.border } },
      };
      if (moneyColumns.includes(colNumber)) {
        cell.numFmt = '$#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });
  }
}

function addFooter(ws: ExcelJS.Worksheet, row: number, colCount: number) {
  ws.mergeCells(row, 1, row, colCount);
  const footerCell = ws.getCell(row, 1);
  footerCell.value = 'EnterHR by EnterSys  ·  Este documento es generado automáticamente  ·  Confidencial';
  footerCell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '94A3B8' } };
  footerCell.alignment = { horizontal: 'center' };
}

function addTotalsRow(ws: ExcelJS.Worksheet, rowNum: number, values: (string | number | null)[], moneyColumns: number[]) {
  const row = ws.getRow(rowNum);
  values.forEach((val, i) => {
    const cell = row.getCell(i + 1);
    cell.value = val;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primaryDark } };
    if (moneyColumns.includes(i + 1) && typeof val === 'number') {
      cell.numFmt = '$#,##0.00';
      cell.alignment = { horizontal: 'right' };
    }
  });
  row.height = 26;
}

async function triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// 1. PROYECCIONES A 12 MESES
// ============================================

export async function downloadProyeccionExcel(
  proyeccion: ProyeccionNomina[],
  params: {
    numEmpleados: number;
    salarioPromedio: number;
    incremento: number;
    mesIncremento: number;
    nuevasContrataciones: number;
    mesContrataciones: number;
  }
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  // --- Hoja 1: Proyección Mensual ---
  const ws = wb.addWorksheet('Proyección 12 Meses', {
    properties: { defaultColWidth: 16 },
  });

  const headers = ['Mes', 'Headcount', 'Percepciones', 'ISR', 'IMSS Empleado', 'IMSS Patrón', 'INFONAVIT', 'ISN', 'Neto Empleados', 'Costo Total Empresa'];
  const colCount = headers.length;
  const moneyColumns = [3, 4, 5, 6, 7, 8, 9, 10];

  applyBrandHeader(ws, 'Proyección de Nómina a 12 Meses', 'Simulación de costos laborales con variables configuradas', colCount);

  // Params section
  const paramRow = 5;
  ws.mergeCells(paramRow, 1, paramRow, colCount);
  const paramCell = ws.getCell(paramRow, 1);
  paramCell.value = `Parámetros: ${params.numEmpleados} empleados  |  Salario diario prom: ${formatMXN(params.salarioPromedio)}  |  Incremento: ${params.incremento}% en mes ${params.mesIncremento}  |  Nuevas contrataciones: ${params.nuevasContrataciones} en mes ${params.mesContrataciones}`;
  paramCell.font = { name: 'Calibri', size: 9, color: { argb: BRAND.accent } };
  paramCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightPurple } };
  paramCell.alignment = { horizontal: 'center' };
  paramCell.border = {
    top: { style: 'thin', color: { argb: BRAND.accent } },
    bottom: { style: 'thin', color: { argb: BRAND.accent } },
  };

  // Data headers
  const headerRow = ws.getRow(7);
  headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
  styleDataHeader(headerRow);

  // Data
  const dataStart = 8;
  proyeccion.forEach((p, idx) => {
    const row = ws.getRow(dataStart + idx);
    row.getCell(1).value = p.mes;
    row.getCell(2).value = p.headcount;
    row.getCell(3).value = p.total_percepciones;
    row.getCell(4).value = p.total_isr;
    row.getCell(5).value = p.total_imss_empleado;
    row.getCell(6).value = p.total_imss_patron;
    row.getCell(7).value = p.total_infonavit;
    row.getCell(8).value = p.total_isn;
    row.getCell(9).value = p.total_neto;
    row.getCell(10).value = p.total_costo_empresa;
  });
  const dataEnd = dataStart + proyeccion.length - 1;
  styleDataRows(ws, dataStart, dataEnd, moneyColumns);

  // Totals
  const totalsRowNum = dataEnd + 1;
  const totals: (string | number | null)[] = [
    'TOTAL ANUAL',
    null,
    proyeccion.reduce((s, p) => s + p.total_percepciones, 0),
    proyeccion.reduce((s, p) => s + p.total_isr, 0),
    proyeccion.reduce((s, p) => s + p.total_imss_empleado, 0),
    proyeccion.reduce((s, p) => s + p.total_imss_patron, 0),
    proyeccion.reduce((s, p) => s + p.total_infonavit, 0),
    proyeccion.reduce((s, p) => s + p.total_isn, 0),
    proyeccion.reduce((s, p) => s + p.total_neto, 0),
    proyeccion.reduce((s, p) => s + p.total_costo_empresa, 0),
  ];
  addTotalsRow(ws, totalsRowNum, totals, moneyColumns);

  // Footer
  addFooter(ws, totalsRowNum + 2, colCount);

  // Column widths
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 12;
  for (let c = 3; c <= 10; c++) ws.getColumn(c).width = 18;

  // --- Hoja 2: Resumen Ejecutivo ---
  const ws2 = wb.addWorksheet('Resumen Ejecutivo');
  applyBrandHeader(ws2, 'Resumen Ejecutivo de Proyección', 'Indicadores clave del escenario simulado', 4);

  const kpis = [
    ['Indicador', 'Valor', 'Detalle', 'Tipo'],
    ['Costo Total Anual', proyeccion.reduce((s, p) => s + p.total_costo_empresa, 0), 'Suma de todos los costos patronales', 'Financiero'],
    ['Nómina Neta Anual', proyeccion.reduce((s, p) => s + p.total_neto, 0), 'Total pagado a empleados', 'Financiero'],
    ['IMSS Patrón Anual', proyeccion.reduce((s, p) => s + p.total_imss_patron, 0), 'Cuotas patronales del IMSS', 'Obligación'],
    ['ISR Retenido Anual', proyeccion.reduce((s, p) => s + p.total_isr, 0), 'ISR retenido a empleados', 'Fiscal'],
    ['ISN Anual', proyeccion.reduce((s, p) => s + p.total_isn, 0), 'Impuesto Sobre Nómina estatal', 'Fiscal'],
    ['INFONAVIT Anual', proyeccion.reduce((s, p) => s + p.total_infonavit, 0), 'Aportación patronal INFONAVIT', 'Obligación'],
    ['Headcount Inicial', proyeccion[0]?.headcount ?? 0, 'Empleados al inicio', 'Headcount'],
    ['Headcount Final', proyeccion[proyeccion.length - 1]?.headcount ?? 0, 'Empleados al cierre', 'Headcount'],
    ['Costo Promedio Mensual', proyeccion.reduce((s, p) => s + p.total_costo_empresa, 0) / 12, 'Costo mensual promedio', 'Financiero'],
  ];

  kpis.forEach((row, idx) => {
    const r = ws2.getRow(6 + idx);
    row.forEach((val, ci) => { r.getCell(ci + 1).value = val as string | number; });
    if (idx === 0) {
      styleDataHeader(r);
    }
  });
  styleDataRows(ws2, 7, 6 + kpis.length - 1, [2]);
  ws2.getColumn(1).width = 28;
  ws2.getColumn(2).width = 22;
  ws2.getColumn(3).width = 35;
  ws2.getColumn(4).width = 14;

  addFooter(ws2, 6 + kpis.length + 2, 4);

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Proyeccion_Nomina_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================
// 2. SIMULACIÓN DE NÓMINA INDIVIDUAL
// ============================================

export async function downloadSimulacionNominaExcel(
  recibo: ReciboNomina,
  costoAnual: {
    nomina_anual: number;
    aguinaldo: number;
    prima_vacacional: number;
    imss_patron_anual: number;
    infonavit_anual: number;
    isn_anual: number;
    costo_total_anual: number;
  }
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  const ws = wb.addWorksheet('Simulación Nómina');
  const colCount = 4;
  applyBrandHeader(ws, 'Simulación de Nómina Individual', `Periodo: ${recibo.periodo.tipo} | ${recibo.periodo.fecha_inicio} a ${recibo.periodo.fecha_fin}`, colCount);

  // Info empleado
  let r = 5;
  const infoData = [
    ['Salario Diario', formatMXN(recibo.empleado.salario_diario), 'Periodo', recibo.periodo.tipo],
    ['SDI', formatMXN(recibo.detalle_sdi.sdi), 'Factor Integración', recibo.detalle_sdi.factor_integracion.toString()],
    ['Antigüedad', `${recibo.detalle_sdi.antiguedad_anios} años`, 'Días Vacaciones', recibo.detalle_sdi.dias_vacaciones.toString()],
    ['Jornada', recibo.empleado.tipo_jornada, 'Contrato', recibo.empleado.tipo_contrato],
  ];

  ws.mergeCells(r, 1, r, colCount);
  const infoTitle = ws.getCell(r, 1);
  infoTitle.value = 'DATOS DEL EMPLEADO';
  infoTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.primary } };
  infoTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
  r++;

  infoData.forEach((row) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = row[0];
    exRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '475569' } };
    exRow.getCell(2).value = row[1];
    exRow.getCell(2).font = { name: 'Calibri', size: 10 };
    exRow.getCell(3).value = row[2];
    exRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '475569' } };
    exRow.getCell(4).value = row[3];
    exRow.getCell(4).font = { name: 'Calibri', size: 10 };
    r++;
  });

  // Percepciones
  r++;
  ws.mergeCells(r, 1, r, colCount);
  const percTitle = ws.getCell(r, 1);
  percTitle.value = 'PERCEPCIONES';
  percTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  percTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.green } };
  r++;

  const percepciones = [
    ['Salario', recibo.percepciones.salario],
    ['Horas Extras Dobles', recibo.percepciones.horas_extras_dobles],
    ['Horas Extras Triples', recibo.percepciones.horas_extras_triples],
    ['Premio Puntualidad', recibo.percepciones.premio_puntualidad],
    ['Premio Asistencia', recibo.percepciones.premio_asistencia],
    ['Comisiones', recibo.percepciones.comisiones],
    ['Otros', recibo.percepciones.otros],
  ].filter(([, v]) => (v as number) > 0);

  percepciones.forEach(([label, value]) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    exRow.getCell(2).numFmt = '$#,##0.00';
    exRow.getCell(1).font = { name: 'Calibri', size: 10 };
    exRow.getCell(2).font = { name: 'Calibri', size: 10 };
    exRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightGreen } };
    exRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightGreen } };
    r++;
  });

  // Total percepciones
  const percTotalRow = ws.getRow(r);
  percTotalRow.getCell(1).value = 'TOTAL PERCEPCIONES';
  percTotalRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
  percTotalRow.getCell(2).value = recibo.percepciones.total_percepciones;
  percTotalRow.getCell(2).numFmt = '$#,##0.00';
  percTotalRow.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.green } };
  r += 2;

  // Deducciones
  ws.mergeCells(r, 1, r, colCount);
  const dedTitle = ws.getCell(r, 1);
  dedTitle.value = 'DEDUCCIONES';
  dedTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  dedTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.red } };
  r++;

  const deducciones = [
    ['ISR (Art. 96 LISR)', recibo.deducciones.isr],
    ['IMSS Trabajador', recibo.deducciones.imss_trabajador],
    ['INFONAVIT', recibo.deducciones.infonavit],
    ['FONACOT', recibo.deducciones.fonacot],
    ['Préstamos', recibo.deducciones.prestamos],
    ['Otros', recibo.deducciones.otros],
  ].filter(([, v]) => (v as number) > 0);

  deducciones.forEach(([label, value]) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    exRow.getCell(2).numFmt = '$#,##0.00';
    exRow.getCell(1).font = { name: 'Calibri', size: 10 };
    exRow.getCell(2).font = { name: 'Calibri', size: 10 };
    exRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightRed } };
    exRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightRed } };
    r++;
  });

  const dedTotalRow = ws.getRow(r);
  dedTotalRow.getCell(1).value = 'TOTAL DEDUCCIONES';
  dedTotalRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
  dedTotalRow.getCell(2).value = recibo.deducciones.total_deducciones;
  dedTotalRow.getCell(2).numFmt = '$#,##0.00';
  dedTotalRow.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.red } };
  r += 2;

  // Neto a pagar
  ws.mergeCells(r, 1, r, colCount);
  const netoCell = ws.getCell(r, 1);
  netoCell.value = `NETO A PAGAR:  ${formatMXN(recibo.neto_a_pagar)}`;
  netoCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BRAND.headerText } };
  netoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.green } };
  netoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(r).height = 36;
  r += 2;

  // Costo empresa
  ws.mergeCells(r, 1, r, colCount);
  const costoTitle = ws.getCell(r, 1);
  costoTitle.value = 'COSTO TOTAL EMPRESA (PERIODO)';
  costoTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  costoTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.accent } };
  r++;

  const costoEmp = [
    ['Salario Bruto', recibo.costo_empresa.salario_bruto],
    ['IMSS Patrón', recibo.costo_empresa.imss_patron],
    ['INFONAVIT Patrón', recibo.costo_empresa.infonavit_patron],
    ['ISN', recibo.costo_empresa.isn],
    ['TOTAL COSTO EMPRESA', recibo.costo_empresa.total_costo],
  ];

  costoEmp.forEach(([label, value], idx) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    exRow.getCell(2).numFmt = '$#,##0.00';
    const isTotal = idx === costoEmp.length - 1;
    exRow.getCell(1).font = { name: 'Calibri', size: 10, bold: isTotal };
    exRow.getCell(2).font = { name: 'Calibri', size: isTotal ? 12 : 10, bold: isTotal, color: isTotal ? { argb: BRAND.accent } : undefined };
    exRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightPurple } };
    exRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightPurple } };
    r++;
  });

  r += 2;

  // Costo anual
  ws.mergeCells(r, 1, r, colCount);
  const anualTitle = ws.getCell(r, 1);
  anualTitle.value = 'COSTO ANUAL DEL EMPLEADO';
  anualTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  anualTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primaryDark } };
  r++;

  const anualData = [
    ['Nómina Anual', costoAnual.nomina_anual],
    ['Aguinaldo', costoAnual.aguinaldo],
    ['Prima Vacacional', costoAnual.prima_vacacional],
    ['IMSS Patrón Anual', costoAnual.imss_patron_anual],
    ['INFONAVIT Anual', costoAnual.infonavit_anual],
    ['ISN Anual', costoAnual.isn_anual],
    ['COSTO TOTAL ANUAL', costoAnual.costo_total_anual],
  ];

  anualData.forEach(([label, value], idx) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    exRow.getCell(2).numFmt = '$#,##0.00';
    const isTotal = idx === anualData.length - 1;
    exRow.getCell(1).font = { name: 'Calibri', size: 10, bold: isTotal };
    exRow.getCell(2).font = { name: 'Calibri', size: isTotal ? 12 : 10, bold: isTotal, color: isTotal ? { argb: BRAND.primary } : undefined };
    r++;
  });

  r += 2;
  addFooter(ws, r, colCount);

  // Column widths
  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Simulacion_Nomina_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================
// 3. PRESTACIONES ANUALES
// ============================================

export async function downloadPrestacionesExcel(
  prestaciones: PrestacionesAnuales,
  salarioDiario: number
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  const ws = wb.addWorksheet('Prestaciones de Ley');
  const colCount = 4;
  applyBrandHeader(ws, 'Cálculo de Prestaciones de Ley', `Salario Diario: ${formatMXN(salarioDiario)}`, colCount);

  let r = 5;

  // Aguinaldo
  ws.mergeCells(r, 1, r, colCount);
  const aguiTitle = ws.getCell(r, 1);
  aguiTitle.value = 'AGUINALDO (Art. 87 LFT)';
  aguiTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  aguiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.green } };
  r++;

  const aguiData = [
    ['Días', prestaciones.aguinaldo.dias],
    ['Monto Bruto', prestaciones.aguinaldo.monto_bruto],
    ['Parte Exenta', prestaciones.aguinaldo.parte_exenta],
    ['Parte Gravada', prestaciones.aguinaldo.parte_gravada],
    ['ISR', prestaciones.aguinaldo.isr],
    ['NETO', prestaciones.aguinaldo.neto],
  ];

  aguiData.forEach(([label, value], idx) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    if (idx > 0) exRow.getCell(2).numFmt = '$#,##0.00';
    const isTotal = idx === aguiData.length - 1;
    exRow.getCell(1).font = { name: 'Calibri', size: 10, bold: isTotal };
    exRow.getCell(2).font = { name: 'Calibri', size: isTotal ? 12 : 10, bold: isTotal, color: isTotal ? { argb: BRAND.green } : undefined };
    r++;
  });

  r++;

  // Prima Vacacional
  ws.mergeCells(r, 1, r, colCount);
  const primaTitle = ws.getCell(r, 1);
  primaTitle.value = 'PRIMA VACACIONAL (Art. 80 LFT)';
  primaTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  primaTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
  r++;

  const primaData = [
    ['Días Vacaciones', prestaciones.prima_vacacional.dias_vacaciones],
    ['Tasa', prestaciones.prima_vacacional.tasa * 100],
    ['Monto Bruto', prestaciones.prima_vacacional.monto_bruto],
    ['Parte Exenta', prestaciones.prima_vacacional.parte_exenta],
    ['Parte Gravada', prestaciones.prima_vacacional.parte_gravada],
    ['ISR', prestaciones.prima_vacacional.isr],
    ['NETO', prestaciones.prima_vacacional.neto],
  ];

  primaData.forEach(([label, value], idx) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    if (idx > 1) exRow.getCell(2).numFmt = '$#,##0.00';
    if (idx === 1) exRow.getCell(2).numFmt = '0"%"';
    const isTotal = idx === primaData.length - 1;
    exRow.getCell(1).font = { name: 'Calibri', size: 10, bold: isTotal };
    exRow.getCell(2).font = { name: 'Calibri', size: isTotal ? 12 : 10, bold: isTotal, color: isTotal ? { argb: BRAND.primary } : undefined };
    r++;
  });

  r++;

  // Vacaciones
  ws.mergeCells(r, 1, r, colCount);
  const vacTitle = ws.getCell(r, 1);
  vacTitle.value = 'VACACIONES (Art. 76 LFT - Reforma 2023)';
  vacTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
  vacTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.accent } };
  r++;

  const vacData = [
    ['Días Correspondientes', prestaciones.vacaciones.dias_correspondientes],
    ['Monto por Día', prestaciones.vacaciones.monto_por_dia],
    ['Valor Total', prestaciones.vacaciones.dias_correspondientes * prestaciones.vacaciones.monto_por_dia],
  ];

  vacData.forEach(([label, value], idx) => {
    const exRow = ws.getRow(r);
    exRow.getCell(1).value = label as string;
    exRow.getCell(2).value = value as number;
    if (idx > 0) exRow.getCell(2).numFmt = '$#,##0.00';
    exRow.getCell(1).font = { name: 'Calibri', size: 10 };
    exRow.getCell(2).font = { name: 'Calibri', size: 10 };
    r++;
  });

  r++;

  // Legal reference
  ws.mergeCells(r, 1, r, colCount);
  const legalCell = ws.getCell(r, 1);
  legalCell.value = 'Aguinaldo: Art. 87 LFT (15 días mín), exención 30 UMA (Art. 93 XIV LISR)  |  Prima Vacacional: Art. 80 LFT (25%), exención 15 UMA  |  Vacaciones: Art. 76 LFT (reforma 2023, inicia 12 días)';
  legalCell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '64748B' } };
  legalCell.alignment = { wrapText: true };
  ws.getRow(r).height = 30;

  r += 2;
  addFooter(ws, r, colCount);

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 20;

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Prestaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================
// 4. NÓMINA / RECIBOS (PAYROLL)
// ============================================

export async function downloadPayrollExcel(slips: SalarySlip[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  const ws = wb.addWorksheet('Recibos de Nómina');
  const headers = ['ID', 'Empleado', 'ID Empleado', 'Departamento', 'Puesto', 'Periodo Inicio', 'Periodo Fin', 'Fecha Emisión', 'Bruto', 'Deducciones', 'Neto', 'Estado'];
  const colCount = headers.length;
  const moneyColumns = [9, 10, 11];

  const period = slips[0] ? `${slips[0].start_date} a ${slips[0].end_date}` : 'Todos los periodos';
  applyBrandHeader(ws, 'Reporte de Nómina', period, colCount);

  // Stats row
  const totalGross = slips.reduce((s, sl) => s + (sl.gross_pay ?? 0), 0);
  const totalDed = slips.reduce((s, sl) => s + (sl.total_deduction ?? 0), 0);
  const totalNet = slips.reduce((s, sl) => s + (sl.net_pay ?? 0), 0);

  const statsRow = 5;
  ws.mergeCells(statsRow, 1, statsRow, colCount);
  const statsCell = ws.getCell(statsRow, 1);
  statsCell.value = `${slips.length} recibos  |  Total Bruto: ${formatMXN(totalGross)}  |  Total Deducciones: ${formatMXN(totalDed)}  |  Total Neto: ${formatMXN(totalNet)}`;
  statsCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.primary } };
  statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
  statsCell.alignment = { horizontal: 'center' };

  // Data headers
  const headerRow = ws.getRow(7);
  headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
  styleDataHeader(headerRow);

  // Data
  const dataStart = 8;
  slips.forEach((slip, idx) => {
    const row = ws.getRow(dataStart + idx);
    row.getCell(1).value = slip.name;
    row.getCell(2).value = slip.employee_name;
    row.getCell(3).value = slip.employee;
    row.getCell(4).value = slip.department || '';
    row.getCell(5).value = slip.designation || '';
    row.getCell(6).value = slip.start_date;
    row.getCell(7).value = slip.end_date;
    row.getCell(8).value = slip.posting_date;
    row.getCell(9).value = slip.gross_pay;
    row.getCell(10).value = slip.total_deduction;
    row.getCell(11).value = slip.net_pay;
    row.getCell(12).value = slip.status;
  });
  const dataEnd = dataStart + slips.length - 1;
  styleDataRows(ws, dataStart, dataEnd, moneyColumns);

  // Totals
  const totalsRowNum = dataEnd + 1;
  addTotalsRow(ws, totalsRowNum, [
    'TOTALES', null, null, null, null, null, null, null,
    totalGross, totalDed, totalNet, null,
  ], moneyColumns);

  // Department summary
  const deptSummary = new Map<string, { count: number; gross: number; deduction: number; net: number }>();
  slips.forEach((sl) => {
    const dept = sl.department || 'Sin Departamento';
    const existing = deptSummary.get(dept) || { count: 0, gross: 0, deduction: 0, net: 0 };
    existing.count++;
    existing.gross += sl.gross_pay ?? 0;
    existing.deduction += sl.total_deduction ?? 0;
    existing.net += sl.net_pay ?? 0;
    deptSummary.set(dept, existing);
  });

  let deptRow = totalsRowNum + 3;
  ws.mergeCells(deptRow, 1, deptRow, colCount);
  const deptTitle = ws.getCell(deptRow, 1);
  deptTitle.value = 'RESUMEN POR DEPARTAMENTO';
  deptTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: BRAND.primary } };
  deptTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
  deptTitle.alignment = { horizontal: 'center' };
  deptRow++;

  const deptHeaders = ['Departamento', 'Empleados', 'Total Bruto', 'Total Deducciones', 'Total Neto'];
  const deptHeaderRow = ws.getRow(deptRow);
  deptHeaders.forEach((h, i) => { deptHeaderRow.getCell(i + 1).value = h; });
  styleDataHeader(deptHeaderRow);
  deptRow++;

  const deptStart = deptRow;
  deptSummary.forEach((data, dept) => {
    const row = ws.getRow(deptRow);
    row.getCell(1).value = dept;
    row.getCell(2).value = data.count;
    row.getCell(3).value = data.gross;
    row.getCell(4).value = data.deduction;
    row.getCell(5).value = data.net;
    deptRow++;
  });
  styleDataRows(ws, deptStart, deptRow - 1, [3, 4, 5]);

  deptRow += 2;
  addFooter(ws, deptRow, colCount);

  // Column widths
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 18;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 14;
  ws.getColumn(7).width = 14;
  ws.getColumn(8).width = 14;
  ws.getColumn(9).width = 16;
  ws.getColumn(10).width = 16;
  ws.getColumn(11).width = 16;
  ws.getColumn(12).width = 12;

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Nomina_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================
// 5. PLANTILLA DE CARGA MASIVA DE EMPLEADOS
// ============================================

export interface DesignationWithHierarchy {
  name: string;
  level?: number;
  levelLabel?: string;
  parentDesignation?: string;
  isExecutive?: boolean;
}

export interface BulkTemplateCatalogs {
  companies?: string[];
  departments?: string[];
  designations?: string[];
  designationsWithHierarchy?: DesignationWithHierarchy[];
  branches?: string[];
  employmentTypes?: string[];
  employees?: { id: string; name: string }[];
}

export async function downloadPlantillaCargaMasiva(dynamicCatalogs?: BulkTemplateCatalogs): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  // ---- Catálogos (hoja oculta para validaciones) ----
  const wsCat = wb.addWorksheet('Catalogos', { state: 'veryHidden' });
  const catalogos: Record<string, string[]> = {
    genero: ['Masculino', 'Femenino', 'Otro'],
    tipo_empleo: dynamicCatalogs?.employmentTypes?.length
      ? dynamicCatalogs.employmentTypes
      : ['Tiempo Completo', 'Medio Tiempo', 'Contrato', 'Becario', 'Comisión', 'Freelance', 'Por Obra'],
    estado_civil: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)'],
    grupo_sanguineo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    moneda: ['MXN', 'USD'],
    bancos: ['BBVA', 'Santander', 'Banorte', 'HSBC', 'Scotiabank', 'Citibanamex', 'Banco Azteca', 'Inbursa', 'BanCoppel', 'Banregio', 'Afirme', 'Otro'],
    parentesco: ['Padre', 'Madre', 'Esposo(a)', 'Hermano(a)', 'Hijo(a)', 'Otro'],
    empresa: dynamicCatalogs?.companies ?? [],
    departamento: dynamicCatalogs?.departments ?? [],
    puesto: dynamicCatalogs?.designations ?? [],
    sucursal: dynamicCatalogs?.branches ?? [],
    reporta_a: dynamicCatalogs?.employees?.map(e => e.id) ?? [],
  };
  // Escribir catálogos en columnas (solo los que tienen valores)
  const catKeys = Object.keys(catalogos).filter(k => catalogos[k].length > 0);
  catKeys.forEach((key, colIdx) => {
    const col = colIdx + 1;
    wsCat.getCell(1, col).value = key;
    catalogos[key].forEach((val, rowIdx) => {
      wsCat.getCell(rowIdx + 2, col).value = val;
    });
  });

  // Helper para referencia de catálogo
  const catRef = (key: string) => {
    const colIdx = catKeys.indexOf(key) + 1;
    if (colIdx === 0) return '';
    const colLetter = String.fromCharCode(64 + colIdx);
    const count = catalogos[key].length;
    return `Catalogos!$${colLetter}$2:$${colLetter}$${count + 1}`;
  };

  // ---- Hoja 1: Instrucciones ----
  const wsInst = wb.addWorksheet('Instrucciones');
  applyBrandHeader(wsInst, 'Plantilla de Carga Masiva de Empleados', 'Instrucciones de llenado', 3);

  const instrucciones = [
    ['', '', ''],
    ['INSTRUCCIONES GENERALES', '', ''],
    ['1.', 'Llene los datos de cada empleado en la hoja "Empleados", un empleado por fila.', ''],
    ['2.', 'Los campos marcados con asterisco (*) son obligatorios.', ''],
    ['3.', 'Las columnas con fondo AZUL son obligatorias, las de fondo VERDE son opcionales pero recomendadas, las de fondo GRIS son opcionales.', ''],
    ['4.', 'Los campos con listas desplegables (Género, Tipo Empleo, etc.) solo aceptan los valores del catálogo.', ''],
    ['5.', 'Las fechas deben ingresarse en formato AAAA-MM-DD (ejemplo: 1990-05-15).', ''],
    ['6.', 'La CURP debe tener exactamente 18 caracteres y el RFC 13 caracteres (persona física).', ''],
    ['7.', 'La CLABE interbancaria debe tener exactamente 18 dígitos numéricos.', ''],
    ['8.', 'La primera fila de datos (fila 6) contiene un ejemplo. Reemplácela con datos reales.', ''],
    ['9.', 'No modifique los encabezados de las columnas ni el orden de las mismas.', ''],
    ['10.', 'Puede agregar tantas filas como empleados necesite cargar.', ''],
    ['', '', ''],
    ['SECCIONES DE DATOS', '', ''],
    ['Sección', 'Columnas', 'Descripción'],
    ['Datos Personales', 'A - F', 'Nombre, género, fecha de nacimiento'],
    ['Datos Laborales', 'G - L', 'Ingreso, empresa, departamento, puesto, tipo contrato, sucursal'],
    ['Identificación MX', 'M - O', 'RFC, CURP, NSS (seguridad social)'],
    ['Datos Demográficos', 'P - Q', 'Estado civil, grupo sanguíneo'],
    ['Contacto', 'R - V', 'Teléfonos, emails, dirección, LinkedIn'],
    ['Información Bancaria', 'W - Y', 'Banco, número de cuenta, CLABE'],
    ['Contacto de Emergencia', 'Z - AB', 'Nombre, teléfono y parentesco'],
    ['Compensación', 'AC - AD', 'Salario/CTC y moneda'],
    ['Organización', 'AE', 'Reporta a (ID del supervisor)'],
    ['', '', ''],
    ['NOTAS IMPORTANTES', '', ''],
    ['•', 'Si el empleado reporta a un supervisor, ingrese el ID del empleado supervisor (ej: HR-EMP-00001).', ''],
    ['•', 'El campo "Empresa" debe coincidir exactamente con el nombre registrado en el sistema.', ''],
    ['•', 'Para departamentos y puestos, use los nombres exactos del catálogo del sistema.', ''],
    ['•', 'El salario/CTC se ingresa como monto mensual bruto en la moneda indicada.', ''],
  ];

  instrucciones.forEach((row, idx) => {
    const r = wsInst.getRow(5 + idx);
    row.forEach((val, ci) => {
      r.getCell(ci + 1).value = val;
    });
    // Style section headers
    if (row[0] === 'INSTRUCCIONES GENERALES' || row[0] === 'SECCIONES DE DATOS' || row[0] === 'NOTAS IMPORTANTES') {
      r.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: BRAND.primary } };
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
      r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
    }
    if (row[0] === 'Sección') {
      r.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.headerText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
      });
    }
    // Numbered instructions
    if (typeof row[0] === 'string' && /^\d+\.$/.test(row[0])) {
      r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.primary } };
      r.getCell(2).font = { name: 'Calibri', size: 10 };
      r.getCell(2).alignment = { wrapText: true };
    }
    if (row[0] === '•') {
      r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.orange } };
      r.getCell(2).font = { name: 'Calibri', size: 10 };
      r.getCell(2).alignment = { wrapText: true };
    }
  });

  wsInst.getColumn(1).width = 22;
  wsInst.getColumn(2).width = 80;
  wsInst.getColumn(3).width = 30;

  addFooter(wsInst, 5 + instrucciones.length + 1, 3);

  // ---- Hoja 2: Empleados (plantilla de datos) ----
  const wsEmp = wb.addWorksheet('Empleados');

  // Definición de columnas
  interface ColDef {
    header: string;
    key: string;
    width: number;
    required: boolean;
    section: 'personal' | 'laboral' | 'identificacion' | 'demografico' | 'contacto' | 'bancario' | 'emergencia' | 'compensacion' | 'organizacion';
    validation?: string;
    softValidation?: boolean; // true = dropdown sugerencias, false = dropdown estricto
    dateFormat?: boolean;
    example: string | number;
    tooltip?: string;
  }

  const columns: ColDef[] = [
    // Datos Personales (A-F)
    { header: 'Nombre(s) *', key: 'first_name', width: 20, required: true, section: 'personal', example: 'JUAN CARLOS', tooltip: 'Nombre(s) del empleado' },
    { header: 'Segundo Nombre', key: 'middle_name', width: 18, required: false, section: 'personal', example: '', tooltip: 'Segundo nombre (opcional)' },
    { header: 'Apellido Paterno *', key: 'last_name', width: 20, required: true, section: 'personal', example: 'PÉREZ', tooltip: 'Primer apellido' },
    { header: 'Apellido Materno', key: 'last_name_2', width: 20, required: false, section: 'personal', example: 'GARCÍA', tooltip: 'Segundo apellido' },
    { header: 'Género *', key: 'gender', width: 14, required: true, section: 'personal', validation: 'genero', example: 'Masculino', tooltip: 'Masculino, Femenino, Otro' },
    { header: 'Fecha Nacimiento *', key: 'date_of_birth', width: 18, required: true, section: 'personal', dateFormat: true, example: '1990-05-15', tooltip: 'Formato: AAAA-MM-DD' },
    // Datos Laborales (G-L)
    { header: 'Fecha Ingreso *', key: 'date_of_joining', width: 18, required: true, section: 'laboral', dateFormat: true, example: '2024-01-15', tooltip: 'Formato: AAAA-MM-DD' },
    { header: 'Empresa *', key: 'company', width: 28, required: true, section: 'laboral', validation: 'empresa', softValidation: true, example: 'ENTERSYS CONSULTORES', tooltip: 'Seleccione o escriba nueva empresa' },
    { header: 'Departamento *', key: 'department', width: 22, required: true, section: 'laboral', validation: 'departamento', softValidation: true, example: 'Tecnología', tooltip: 'Seleccione o escriba nuevo departamento' },
    { header: 'Puesto *', key: 'designation', width: 22, required: true, section: 'laboral', validation: 'puesto', softValidation: true, example: 'Desarrollador Senior', tooltip: 'Seleccione o escriba nuevo puesto' },
    { header: 'Tipo Empleo *', key: 'employment_type', width: 16, required: true, section: 'laboral', validation: 'tipo_empleo', example: 'Tiempo Completo', tooltip: 'Seleccione tipo de contratación' },
    { header: 'Sucursal', key: 'branch', width: 18, required: false, section: 'laboral', validation: 'sucursal', softValidation: true, example: 'CDMX', tooltip: 'Seleccione o escriba nueva sucursal' },
    // Identificación MX (M-O)
    { header: 'RFC', key: 'rfc', width: 18, required: false, section: 'identificacion', example: 'PEGJ900515AB1', tooltip: '13 caracteres (persona física)' },
    { header: 'CURP', key: 'curp', width: 22, required: false, section: 'identificacion', example: 'PEGJ900515HDFRRC09', tooltip: '18 caracteres' },
    { header: 'NSS (IMSS)', key: 'nss', width: 16, required: false, section: 'identificacion', example: '12345678901', tooltip: 'Número de Seguridad Social' },
    // Datos Demográficos (P-Q)
    { header: 'Estado Civil', key: 'marital_status', width: 14, required: false, section: 'demografico', validation: 'estado_civil', example: 'Soltero(a)', tooltip: 'Soltero(a), Casado(a), Divorciado(a), Viudo(a)' },
    { header: 'Grupo Sanguíneo', key: 'blood_group', width: 16, required: false, section: 'demografico', validation: 'grupo_sanguineo', example: 'O+', tooltip: 'Tipo de sangre' },
    // Contacto (R-V)
    { header: 'Teléfono Celular', key: 'cell_phone', width: 18, required: false, section: 'contacto', example: '+52 55 1234 5678', tooltip: 'Incluir código de país' },
    { header: 'Email Personal', key: 'personal_email', width: 28, required: false, section: 'contacto', example: 'juan.perez@gmail.com', tooltip: 'Correo personal' },
    { header: 'Email Corporativo', key: 'company_email', width: 28, required: false, section: 'contacto', example: 'jperez@entersys.com', tooltip: 'Correo de empresa' },
    { header: 'Dirección Actual', key: 'current_address', width: 35, required: false, section: 'contacto', example: 'Av. Reforma 222, Col. Juárez, CDMX 06600', tooltip: 'Dirección actual completa' },
    { header: 'LinkedIn', key: 'linkedin_profile', width: 30, required: false, section: 'contacto', example: 'linkedin.com/in/juanperez', tooltip: 'URL del perfil' },
    // Bancario (W-Y)
    { header: 'Banco', key: 'bank_name', width: 18, required: false, section: 'bancario', validation: 'bancos', example: 'BBVA', tooltip: 'Institución bancaria' },
    { header: 'No. Cuenta', key: 'bank_ac_no', width: 20, required: false, section: 'bancario', example: '0123456789', tooltip: 'Número de cuenta' },
    { header: 'CLABE', key: 'clabe', width: 22, required: false, section: 'bancario', example: '012345678901234567', tooltip: '18 dígitos' },
    // Emergencia (Z-AB)
    { header: 'Contacto Emergencia', key: 'emergency_contact_name', width: 22, required: false, section: 'emergencia', example: 'MARÍA GARCÍA', tooltip: 'Nombre completo' },
    { header: 'Tel. Emergencia', key: 'emergency_phone', width: 18, required: false, section: 'emergencia', example: '+52 55 9876 5432', tooltip: 'Teléfono de contacto' },
    { header: 'Parentesco', key: 'relation', width: 16, required: false, section: 'emergencia', validation: 'parentesco', example: 'Madre', tooltip: 'Relación con el empleado' },
    // Compensación (AC-AD)
    { header: 'Salario Mensual (CTC)', key: 'ctc', width: 20, required: false, section: 'compensacion', example: 25000, tooltip: 'Costo Total para la empresa (mensual)' },
    { header: 'Moneda', key: 'salary_currency', width: 10, required: false, section: 'compensacion', validation: 'moneda', example: 'MXN', tooltip: 'MXN o USD' },
    // Organización (AE)
    { header: 'Reporta a (ID)', key: 'reports_to', width: 20, required: false, section: 'organizacion', validation: 'reporta_a', softValidation: true, example: 'HR-EMP-00001', tooltip: 'ID del supervisor (ver hoja Referencia)' },
  ];

  const sectionColors: Record<string, string> = {
    personal: BRAND.primary,       // Azul (obligatorio mix)
    laboral: BRAND.primaryDark,    // Azul oscuro
    identificacion: '059669',      // Verde oscuro
    demografico: '059669',
    contacto: '0891B2',            // Teal
    bancario: BRAND.accent,        // Morado
    emergencia: BRAND.orange,      // Naranja
    compensacion: 'B45309',        // Ámbar oscuro
    organizacion: '6B7280',        // Gris
  };

  const sectionBgLight: Record<string, string> = {
    personal: BRAND.sectionBg,
    laboral: BRAND.sectionBg,
    identificacion: 'F0FDF4',
    demografico: 'F0FDF4',
    contacto: 'F0FDFA',
    bancario: BRAND.lightPurple,
    emergencia: 'FFF7ED',
    compensacion: 'FFFBEB',
    organizacion: 'F9FAFB',
  };

  const colCount = columns.length;

  // Header con branding
  wsEmp.mergeCells(1, 1, 1, colCount);
  const logoCell = wsEmp.getCell('A1');
  logoCell.value = 'EnterHR by EnterSys  —  Plantilla de Carga Masiva de Empleados';
  logoCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BRAND.headerText } };
  logoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerBg } };
  logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsEmp.getRow(1).height = 38;

  // Fila 2: Sección labels
  wsEmp.mergeCells(2, 1, 2, 6);
  wsEmp.getCell(2, 1).value = 'DATOS PERSONALES';
  wsEmp.mergeCells(2, 7, 2, 12);
  wsEmp.getCell(2, 7).value = 'DATOS LABORALES';
  wsEmp.mergeCells(2, 13, 2, 15);
  wsEmp.getCell(2, 13).value = 'IDENTIFICACIÓN MX';
  wsEmp.mergeCells(2, 16, 2, 17);
  wsEmp.getCell(2, 16).value = 'DEMOGRÁFICO';
  wsEmp.mergeCells(2, 18, 2, 22);
  wsEmp.getCell(2, 18).value = 'CONTACTO';
  wsEmp.mergeCells(2, 23, 2, 25);
  wsEmp.getCell(2, 23).value = 'INFO BANCARIA';
  wsEmp.mergeCells(2, 26, 2, 28);
  wsEmp.getCell(2, 26).value = 'EMERGENCIA';
  wsEmp.mergeCells(2, 29, 2, 30);
  wsEmp.getCell(2, 29).value = 'COMPENSACIÓN';
  wsEmp.getCell(2, 31).value = 'ORG';

  // Colorear secciones en fila 2
  const sectionRanges: { start: number; end: number; section: string }[] = [
    { start: 1, end: 6, section: 'personal' },
    { start: 7, end: 12, section: 'laboral' },
    { start: 13, end: 15, section: 'identificacion' },
    { start: 16, end: 17, section: 'demografico' },
    { start: 18, end: 22, section: 'contacto' },
    { start: 23, end: 25, section: 'bancario' },
    { start: 26, end: 28, section: 'emergencia' },
    { start: 29, end: 30, section: 'compensacion' },
    { start: 31, end: 31, section: 'organizacion' },
  ];

  sectionRanges.forEach(({ start, end, section }) => {
    for (let c = start; c <= end; c++) {
      const cell = wsEmp.getRow(2).getCell(c);
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionColors[section] } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });
  wsEmp.getRow(2).height = 22;

  // Fila 3: Sub-header con indicador requerido/opcional
  for (let c = 1; c <= colCount; c++) {
    const col = columns[c - 1];
    const cell = wsEmp.getRow(3).getCell(c);
    cell.value = col.required ? '● REQUERIDO' : '○ Opcional';
    cell.font = { name: 'Calibri', size: 7, bold: col.required, color: { argb: col.required ? 'DC2626' : '6B7280' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.required ? 'FEE2E2' : 'F3F4F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  wsEmp.getRow(3).height = 16;

  // Fila 4: Tooltips/ayuda
  for (let c = 1; c <= colCount; c++) {
    const col = columns[c - 1];
    const cell = wsEmp.getRow(4).getCell(c);
    cell.value = col.tooltip || '';
    cell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '94A3B8' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
  }
  wsEmp.getRow(4).height = 28;

  // Fila 5: Encabezados principales
  const headerRow = wsEmp.getRow(5);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionColors[col.section] } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: '1E293B' } },
      right: { style: 'thin', color: { argb: 'FFFFFF' } },
    };
  });
  headerRow.height = 32;

  // Fila 6: Ejemplo (datos demo)
  const exampleRow = wsEmp.getRow(6);
  columns.forEach((col, idx) => {
    const cell = exampleRow.getCell(idx + 1);
    cell.value = col.example;
    cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '6B7280' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FCD34D' } } };
    if (col.dateFormat) cell.numFmt = '@'; // Texto para fechas
    if (col.key === 'ctc' && typeof col.example === 'number') cell.numFmt = '$#,##0.00';
  });
  exampleRow.height = 22;

  // Agregar nota en la fila de ejemplo
  wsEmp.getCell(6, 1).note = {
    texts: [{ text: 'Esta fila contiene un ejemplo. Reemplácela con datos reales del primer empleado.', font: { size: 9, name: 'Calibri' } }],
  };

  // Filas 7-56: Filas vacías pre-formateadas (50 filas para llenar)
  for (let r = 7; r <= 56; r++) {
    const row = wsEmp.getRow(r);
    const isAlt = (r - 7) % 2 === 1;
    columns.forEach((col, idx) => {
      const cell = row.getCell(idx + 1);
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.altRow } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBgLight[col.section] } };
      }
      if (col.dateFormat) cell.numFmt = '@';
      if (col.key === 'ctc') cell.numFmt = '$#,##0.00';
    });
  }

  // Aplicar validaciones de datos (dropdowns) en filas 6-56
  columns.forEach((col, idx) => {
    if (col.validation) {
      const ref = catRef(col.validation);
      if (!ref) return; // Skip if catalog is empty
      for (let r = 6; r <= 56; r++) {
        wsEmp.getCell(r, idx + 1).dataValidation = {
          type: 'list',
          allowBlank: !col.required,
          formulae: [ref],
          // softValidation: dropdown as suggestion only (no error blocking)
          showErrorMessage: !col.softValidation,
          errorTitle: col.softValidation ? '' : 'Valor no válido',
          error: col.softValidation ? '' : `Seleccione un valor de la lista para "${col.header.replace(' *', '')}".`,
          showInputMessage: true,
          promptTitle: col.header.replace(' *', ''),
          prompt: col.softValidation
            ? `Sugerencias del catálogo. Puede escribir un valor nuevo si no aparece en la lista.`
            : col.tooltip || 'Seleccione un valor de la lista',
        };
      }
    }
  });

  // Column widths
  columns.forEach((col, idx) => {
    wsEmp.getColumn(idx + 1).width = col.width;
  });

  // Congelar paneles: filas 1-5 y columna A
  wsEmp.views = [
    { state: 'frozen', xSplit: 3, ySplit: 5, activeCell: 'A6' },
  ];

  // Proteger encabezados (solo celdas de datos editables)
  wsEmp.protect('enterhr2026', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    formatRows: true,
    sort: true,
    autoFilter: true,
  });

  // Desbloquear celdas de datos (filas 6-56)
  for (let r = 6; r <= 56; r++) {
    for (let c = 1; c <= colCount; c++) {
      wsEmp.getRow(r).getCell(c).protection = { locked: false };
    }
  }

  // AutoFilter en fila 5
  wsEmp.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: colCount },
  };

  // ---- Hoja 3: Catálogos visible ----
  const wsCatVis = wb.addWorksheet('Referencia de Catálogos');
  applyBrandHeader(wsCatVis, 'Catálogos de Referencia', 'Valores aceptados para campos con lista desplegable', 4);

  let catR = 5;

  // Catálogos fijos (siempre presentes)
  const fixedCatEntries: [string, string[]][] = [
    ['Género', catalogos.genero],
    ['Tipo de Empleo', catalogos.tipo_empleo],
    ['Estado Civil', catalogos.estado_civil],
    ['Grupo Sanguíneo', catalogos.grupo_sanguineo],
    ['Moneda', catalogos.moneda],
    ['Bancos', catalogos.bancos],
    ['Parentesco', catalogos.parentesco],
  ];

  // Catálogos dinámicos (de la BD, pueden estar vacíos) — excepto Puestos que van aparte con jerarquía
  const dynamicCatEntries: [string, string[]][] = [
    ['Empresas (del sistema)', catalogos.empresa ?? []],
    ['Departamentos (del sistema)', catalogos.departamento ?? []],
    ['Sucursales (del sistema)', catalogos.sucursal ?? []],
  ].filter(([, vals]) => vals.length > 0) as [string, string[]][];

  // Add flat puestos only if no hierarchy data is available
  const hasHierarchy = dynamicCatalogs?.designationsWithHierarchy && dynamicCatalogs.designationsWithHierarchy.length > 0;
  if (!hasHierarchy && (catalogos.puesto ?? []).length > 0) {
    dynamicCatEntries.push(['Puestos (del sistema)', catalogos.puesto ?? []]);
  }

  const allCatEntries = [...fixedCatEntries, ...dynamicCatEntries];

  allCatEntries.forEach(([title, values]) => {
    const isDynamic = title.includes('(del sistema)');
    const titleRow = wsCatVis.getRow(catR);
    wsCatVis.mergeCells(catR, 1, catR, 4);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDynamic ? BRAND.accent : BRAND.primary } };
    titleRow.getCell(1).alignment = { horizontal: 'left', indent: 1 };
    catR++;

    // Render values in a grid (4 columns max)
    for (let i = 0; i < values.length; i += 4) {
      const row = wsCatVis.getRow(catR);
      for (let j = 0; j < 4 && i + j < values.length; j++) {
        row.getCell(j + 1).value = values[i + j];
        row.getCell(j + 1).font = { name: 'Calibri', size: 10 };
        row.getCell(j + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDynamic ? BRAND.lightPurple : BRAND.sectionBg } };
        row.getCell(j + 1).border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      }
      catR++;
    }
    catR++; // Espacio entre catálogos
  });

  // Puestos con jerarquía (tabla estructurada)
  if (hasHierarchy) {
    const desigs = dynamicCatalogs!.designationsWithHierarchy!;
    // Sort by level
    const sortedDesigs = [...desigs].sort((a, b) => (a.level ?? 99) - (b.level ?? 99));

    const titleRow = wsCatVis.getRow(catR);
    wsCatVis.mergeCells(catR, 1, catR, 4);
    titleRow.getCell(1).value = 'Puestos — Jerarquía Organizacional';
    titleRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.accent } };
    titleRow.getCell(1).alignment = { horizontal: 'left', indent: 1 };
    catR++;

    // Header row
    const hdrRow = wsCatVis.getRow(catR);
    const hdrLabels = ['Puesto', 'Nivel', 'Reporta a', 'Ejecutivo'];
    hdrLabels.forEach((label, i) => {
      const cell = hdrRow.getCell(i + 1);
      cell.value = label;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6B7280' } };
    });
    catR++;

    const levelColors: Record<number, string> = {
      1: 'FEE2E2', // red-100
      2: 'F3E8FF', // purple-100
      3: 'DBEAFE', // blue-100
      4: 'CFFAFE', // cyan-100
      5: 'DCFCE7', // green-100
      6: 'F3F4F6', // gray-100
    };

    for (const d of sortedDesigs) {
      const row = wsCatVis.getRow(catR);
      const bgColor = levelColors[d.level ?? 5] || 'F3F4F6';
      row.getCell(1).value = d.name;
      row.getCell(1).font = { name: 'Calibri', size: 10, bold: d.isExecutive };
      row.getCell(2).value = d.levelLabel || `Nivel ${d.level ?? '—'}`;
      row.getCell(2).font = { name: 'Calibri', size: 9 };
      row.getCell(3).value = d.parentDesignation || '—';
      row.getCell(3).font = { name: 'Calibri', size: 9 };
      row.getCell(4).value = d.isExecutive ? 'Sí' : '';
      row.getCell(4).font = { name: 'Calibri', size: 9, bold: d.isExecutive, color: { argb: d.isExecutive ? 'DC2626' : '6B7280' } };
      for (let c = 1; c <= 4; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        row.getCell(c).border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      }
      catR++;
    }
    catR++;
  }

  // Empleados existentes (para referencia de reports_to)
  if (dynamicCatalogs?.employees && dynamicCatalogs.employees.length > 0) {
    const empTitleRow = wsCatVis.getRow(catR);
    wsCatVis.mergeCells(catR, 1, catR, 4);
    empTitleRow.getCell(1).value = 'Empleados existentes (para Reporta a)';
    empTitleRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.headerText } };
    empTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.orange } };
    empTitleRow.getCell(1).alignment = { horizontal: 'left', indent: 1 };
    catR++;

    // Header
    const empHeaderRow = wsCatVis.getRow(catR);
    empHeaderRow.getCell(1).value = 'ID Empleado';
    empHeaderRow.getCell(2).value = 'Nombre';
    empHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6B7280' } };
    });
    catR++;

    for (const emp of dynamicCatalogs.employees) {
      const row = wsCatVis.getRow(catR);
      row.getCell(1).value = emp.id;
      row.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
      row.getCell(2).value = emp.name;
      row.getCell(2).font = { name: 'Calibri', size: 10 };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7ED' } };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7ED' } };
      row.getCell(1).border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      row.getCell(2).border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      catR++;
    }
    catR++;
  }

  addFooter(wsCatVis, catR + 1, 4);
  wsCatVis.getColumn(1).width = 24;
  wsCatVis.getColumn(2).width = 30;
  wsCatVis.getColumn(3).width = 22;
  wsCatVis.getColumn(4).width = 22;

  // Asegurar que "Empleados" sea la hoja activa
  wsEmp.state = 'visible';

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Plantilla_Carga_Masiva_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
