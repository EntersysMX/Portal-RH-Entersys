// ============================================
// CORRIDA FINANCIERA DE NÓMINA
// Genera Excel con 3 hojas idénticas al formato EnterSys
// ============================================

import ExcelJS from 'exceljs';

// ---- Tipos ----

export interface CorridaEmpleado {
  id: number;
  apellido_paterno: string;
  apellido_materno: string;
  nombre: string;
  sueldo_quincenal: number;
  banco: string;
  numero_cuenta: string;
  clabe: string;
  /** Mes en que se incorpora (1-12). Si es null, está desde inicio. */
  activo_desde_mes: number | null;
  /** Si se incorpora a mitad de quincena, días que trabaja en la primera quincena */
  dias_primera_quincena: number | null;
}

export interface CargoExtra {
  id: number;
  nombre: string;
  tipo: 'porcentaje' | 'fijo';
  /** Si porcentaje: ej 8 = 8%. Si fijo: monto quincenal */
  valor: number;
}

export interface CorridaConfig {
  empresa: string;
  año: number;
  empleados: CorridaEmpleado[];
  cargos_extras: CargoExtra[];
  /** Cuántos meses ya están pagados (ej: 1 = enero ya pagado) */
  meses_pagados: number;
  /** Empleados que NO estaban en los meses ya pagados (IDs) */
  empleados_excluidos_meses_pagados: number[];
  /** Cargos extra que NO estaban en los meses ya pagados (IDs) */
  cargos_excluidos_meses_pagados: number[];
}

export type VistaPeriodo = 'quincenal' | 'mensual' | 'semestral' | 'anual';

export interface PeriodoRow {
  label: string;
  nomina_empleados: number;
  cargos: { nombre: string; monto: number }[];
  total: number;
  acumulado: number;
}

// ---- Constantes de branding ----
const B = {
  darkBlue: '1E3A5F',
  primary: '2563EB',
  primaryDark: '1E40AF',
  green: '16A34A',
  red: 'DC2626',
  accent: '7C3AED',
  white: 'FFFFFF',
  lightBlue: 'DBEAFE',
  lightGray: 'F1F5F9',
  gray: '64748B',
  border: 'CBD5E1',
  yellow: 'FEF3C7',
  yellowDark: 'D97706',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PERIODO_LABELS: Record<VistaPeriodo, string> = {
  quincenal: 'Quincenal',
  mensual: 'Mensual',
  semestral: 'Semestral',
  anual: 'Anual',
};

const formatMXN = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- Helpers de estilo ----

function headerCell(cell: ExcelJS.Cell, bg: string = B.darkBlue) {
  cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: B.white } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = { bottom: { style: 'thin', color: { argb: B.primaryDark } } };
}

function moneyCell(cell: ExcelJS.Cell, value: number, bold = false, color?: string) {
  cell.value = value;
  cell.numFmt = '$#,##0.00';
  cell.font = { name: 'Calibri', size: 10, bold, color: color ? { argb: color } : undefined };
  cell.alignment = { horizontal: 'right' };
}

function textCell(cell: ExcelJS.Cell, value: string, bold = false, color?: string) {
  cell.value = value;
  cell.font = { name: 'Calibri', size: 10, bold, color: color ? { argb: color } : undefined };
}

function bgRow(row: ExcelJS.Row, colStart: number, colEnd: number, bg: string) {
  for (let c = colStart; c <= colEnd; c++) {
    row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  }
}

function borderRow(row: ExcelJS.Row, colStart: number, colEnd: number) {
  for (let c = colStart; c <= colEnd; c++) {
    row.getCell(c).border = {
      bottom: { style: 'hair', color: { argb: B.border } },
    };
  }
}

// ---- Cálculos ----

interface QuincenaCalc {
  quincena: string;
  nomina_empleados: number;
  cargos: { nombre: string; monto: number }[];
  total: number;
  acumulado: number;
}

interface MesCalc {
  mes: string;
  nomina_empleados: number;
  cargos: { nombre: string; monto: number }[];
  total: number;
  acumulado: number;
}

function calcularQuincenas(config: CorridaConfig): QuincenaCalc[] {
  const { empleados, cargos_extras, meses_pagados, empleados_excluidos_meses_pagados, cargos_excluidos_meses_pagados } = config;
  const quincenas: QuincenaCalc[] = [];
  let acumulado = 0;

  for (let mes = 1; mes <= 12; mes++) {
    for (let q = 1; q <= 2; q++) {
      const qLabel = `${MESES_CORTO[mes - 1]} ${q === 1 ? '1-15' : '16-' + (mes === 2 ? '28' : [4, 6, 9, 11].includes(mes) ? '30' : '31')}`;
      const esPagado = mes <= meses_pagados;

      // Calcular nómina de empleados activos en esta quincena
      let nominaEmpleados = 0;
      for (const emp of empleados) {
        if (esPagado && empleados_excluidos_meses_pagados.includes(emp.id)) continue;

        const activoDesde = emp.activo_desde_mes ?? 1;
        if (mes < activoDesde) continue;

        // Prorrateo en primera quincena del mes de inicio
        if (mes === activoDesde && q === 1 && emp.dias_primera_quincena != null && emp.dias_primera_quincena < 15) {
          const diario = round2(emp.sueldo_quincenal / 15);
          nominaEmpleados += round2(diario * emp.dias_primera_quincena);
        } else {
          nominaEmpleados += emp.sueldo_quincenal;
        }
      }

      // Calcular cargos extras
      const cargos: { nombre: string; monto: number }[] = [];
      for (const cargo of cargos_extras) {
        if (esPagado && cargos_excluidos_meses_pagados.includes(cargo.id)) continue;

        // Los cargos fijos con activo_desde no aplica, simplemente se agregan si no están excluidos
        let monto: number;
        if (cargo.tipo === 'porcentaje') {
          monto = round2(nominaEmpleados * (cargo.valor / 100));
        } else {
          monto = cargo.valor;
        }
        cargos.push({ nombre: cargo.nombre, monto });
      }

      const totalCargos = cargos.reduce((s, c) => s + c.monto, 0);
      const total = round2(nominaEmpleados + totalCargos);
      acumulado = round2(acumulado + total);

      quincenas.push({ quincena: qLabel, nomina_empleados: nominaEmpleados, cargos, total, acumulado });
    }
  }

  return quincenas;
}

function calcularMensual(quincenas: QuincenaCalc[]): MesCalc[] {
  const meses: MesCalc[] = [];
  for (let m = 0; m < 12; m++) {
    const q1 = quincenas[m * 2];
    const q2 = quincenas[m * 2 + 1];

    const nominaEmpleados = round2(q1.nomina_empleados + q2.nomina_empleados);

    // Merge cargos
    const cargosMap = new Map<string, number>();
    for (const c of [...q1.cargos, ...q2.cargos]) {
      cargosMap.set(c.nombre, (cargosMap.get(c.nombre) || 0) + c.monto);
    }
    const cargos = Array.from(cargosMap.entries()).map(([nombre, monto]) => ({ nombre, monto: round2(monto) }));

    const total = round2(nominaEmpleados + cargos.reduce((s, c) => s + c.monto, 0));
    const acumulado = q2.acumulado;

    meses.push({ mes: MESES[m], nomina_empleados: nominaEmpleados, cargos, total, acumulado });
  }
  return meses;
}

function calcularSemestral(meses: MesCalc[]): PeriodoRow[] {
  const semestres: PeriodoRow[] = [];
  for (let s = 0; s < 2; s++) {
    const slice = meses.slice(s * 6, (s + 1) * 6);
    const nomina = round2(slice.reduce((sum, m) => sum + m.nomina_empleados, 0));
    const cargosMap = new Map<string, number>();
    for (const m of slice) {
      for (const c of m.cargos) {
        cargosMap.set(c.nombre, (cargosMap.get(c.nombre) || 0) + c.monto);
      }
    }
    const cargos = Array.from(cargosMap.entries()).map(([nombre, monto]) => ({ nombre, monto: round2(monto) }));
    const total = round2(nomina + cargos.reduce((sum, c) => sum + c.monto, 0));
    const acumulado = s === 0 ? total : round2(semestres[0].total + total);
    semestres.push({
      label: s === 0 ? 'Semestre 1 (Ene-Jun)' : 'Semestre 2 (Jul-Dic)',
      nomina_empleados: nomina,
      cargos,
      total,
      acumulado,
    });
  }
  return semestres;
}

function calcularAnual(meses: MesCalc[], año: number): PeriodoRow[] {
  const nomina = round2(meses.reduce((sum, m) => sum + m.nomina_empleados, 0));
  const cargosMap = new Map<string, number>();
  for (const m of meses) {
    for (const c of m.cargos) {
      cargosMap.set(c.nombre, (cargosMap.get(c.nombre) || 0) + c.monto);
    }
  }
  const cargos = Array.from(cargosMap.entries()).map(([nombre, monto]) => ({ nombre, monto: round2(monto) }));
  const total = round2(nomina + cargos.reduce((sum, c) => sum + c.monto, 0));
  return [{
    label: `Anual ${año}`,
    nomina_empleados: nomina,
    cargos,
    total,
    acumulado: total,
  }];
}

export function calcularVistaPeriodos(config: CorridaConfig): Record<VistaPeriodo, PeriodoRow[]> {
  const quincenas = calcularQuincenas(config);
  const meses = calcularMensual(quincenas);

  return {
    quincenal: quincenas.map((q) => ({
      label: q.quincena,
      nomina_empleados: q.nomina_empleados,
      cargos: q.cargos,
      total: q.total,
      acumulado: q.acumulado,
    })),
    mensual: meses.map((m) => ({
      label: m.mes,
      nomina_empleados: m.nomina_empleados,
      cargos: m.cargos,
      total: m.total,
      acumulado: m.acumulado,
    })),
    semestral: calcularSemestral(meses),
    anual: calcularAnual(meses, config.año),
  };
}

// ---- Generación de hojas de proyección genérica ----

const VISTA_TITLES: Record<VistaPeriodo, string> = {
  quincenal: 'PROYECCIÓN QUINCENAL DE NÓMINA',
  mensual: 'PROYECCIÓN MENSUAL DE NÓMINA',
  semestral: 'PROYECCIÓN SEMESTRAL DE NÓMINA',
  anual: 'RESUMEN ANUAL DE NÓMINA',
};

const VISTA_SHEET_NAMES: Record<VistaPeriodo, string> = {
  quincenal: 'Proyeccion Quincenal',
  mensual: 'Proyeccion Mensual',
  semestral: 'Proyeccion Semestral',
  anual: 'Resumen Anual',
};

function addProjectionSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  title: string,
  subtitle: string,
  rows: PeriodoRow[],
  cargoNames: string[],
  config: CorridaConfig,
) {
  const ws = wb.addWorksheet(sheetName);
  const colCount = 4 + cargoNames.length;
  const endCol = 2 + colCount - 1;

  // Header
  ws.mergeCells(1, 2, 1, endCol);
  const logo = ws.getCell(1, 2);
  logo.value = config.empresa.toUpperCase();
  logo.font = { name: 'Calibri', size: 18, bold: true, color: { argb: B.white } };
  logo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: B.darkBlue } };
  logo.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  ws.mergeCells(2, 2, 2, endCol);
  const titleCell = ws.getCell(2, 2);
  titleCell.value = `${title} ${config.año}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: B.primary } };
  titleCell.alignment = { horizontal: 'center' };

  ws.mergeCells(3, 2, 3, endCol);
  const subCell = ws.getCell(3, 2);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, color: { argb: B.gray } };
  subCell.alignment = { horizontal: 'center' };

  // Column headers
  const headers = ['Periodo', 'Nómina Empleados', ...cargoNames, 'Total', 'Acumulado'];
  const hRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 2);
    cell.value = h;
    headerCell(cell);
  });
  hRow.height = 28;

  // Data rows
  let r = 6;
  rows.forEach((row, idx) => {
    const wsRow = ws.getRow(r);
    textCell(wsRow.getCell(2), row.label);
    moneyCell(wsRow.getCell(3), row.nomina_empleados);

    let ci = 4;
    for (const cargoName of cargoNames) {
      const cargo = row.cargos.find((c) => c.nombre === cargoName);
      moneyCell(wsRow.getCell(ci), cargo?.monto ?? 0);
      ci++;
    }

    moneyCell(wsRow.getCell(ci), row.total, true);
    moneyCell(wsRow.getCell(ci + 1), row.acumulado, false, B.accent);

    if (idx % 2 === 1) bgRow(wsRow, 2, ci + 1, B.lightGray);
    borderRow(wsRow, 2, ci + 1);
    r++;
  });

  // Total row
  const grandTotal = rows[rows.length - 1]?.acumulado ?? 0;
  const totalNomina = rows.reduce((s, row) => s + row.nomina_empleados, 0);

  const totRow = ws.getRow(r);
  textCell(totRow.getCell(2), 'TOTAL', true, B.white);
  moneyCell(totRow.getCell(3), round2(totalNomina), true, B.white);

  let tci = 4;
  for (const cargoName of cargoNames) {
    const cargoTotal = rows.reduce((s, row) => s + (row.cargos.find(c => c.nombre === cargoName)?.monto ?? 0), 0);
    moneyCell(totRow.getCell(tci), round2(cargoTotal), true, B.white);
    tci++;
  }
  moneyCell(totRow.getCell(tci), round2(grandTotal), true, B.white);
  totRow.getCell(tci + 1).value = '';
  bgRow(totRow, 2, tci + 1, B.primaryDark);
  totRow.height = 28;

  r += 2;

  // Accumulated summary (only for views with 6+ periods)
  if (rows.length >= 6) {
    ws.mergeCells(r, 2, r, endCol);
    const accTitle = ws.getCell(r, 2);
    accTitle.value = 'ACUMULADO POR PERIODO';
    accTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: B.primary } };
    accTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: B.lightBlue } };
    accTitle.alignment = { horizontal: 'center' };
    r++;

    const accHRow = ws.getRow(r);
    ['Periodo', 'Acumulado', '% del Total'].forEach((h, i) => {
      const cell = accHRow.getCell(i + 2);
      cell.value = h;
      headerCell(cell);
    });
    r++;

    rows.forEach((row, idx) => {
      const wsRow = ws.getRow(r);
      textCell(wsRow.getCell(2), row.label);
      moneyCell(wsRow.getCell(3), row.acumulado, false, B.primary);
      const pct = grandTotal > 0 ? round2((row.acumulado / grandTotal) * 100) : 0;
      wsRow.getCell(4).value = pct / 100;
      wsRow.getCell(4).numFmt = '0.0%';
      wsRow.getCell(4).font = { name: 'Calibri', size: 10 };
      wsRow.getCell(4).alignment = { horizontal: 'center' };

      if (idx % 2 === 1) bgRow(wsRow, 2, 4, B.lightGray);
      borderRow(wsRow, 2, 4);
      r++;
    });

    r++;
  }

  // Footer
  r++;
  ws.mergeCells(r, 2, r, endCol);
  const footer = ws.getCell(r, 2);
  footer.value = `EnterHR by EnterSys  ·  ${title} ${config.año}  ·  Generado: ${new Date().toLocaleDateString('es-MX')}  ·  Confidencial`;
  footer.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '94A3B8' } };
  footer.alignment = { horizontal: 'center' };

  // Column widths
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 20;
  for (let c = 4; c <= 3 + cargoNames.length; c++) ws.getColumn(c).width = 20;
  ws.getColumn(4 + cargoNames.length).width = 20;
  ws.getColumn(5 + cargoNames.length).width = 20;
}

// ---- Generación de Excel ----

export async function downloadCorridaFinancieraExcel(config: CorridaConfig, vista: VistaPeriodo = 'mensual'): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  const periodos = calcularVistaPeriodos(config);
  const cargoNames = config.cargos_extras.map((c) => c.nombre);
  const totalEmpleados = config.empleados.length;
  const totalNominaQ = config.empleados.reduce((s, e) => s + e.sueldo_quincenal, 0);
  const totalCargosQ = config.cargos_extras.reduce((s, c) => {
    if (c.tipo === 'porcentaje') return s + round2(totalNominaQ * c.valor / 100);
    return s + c.valor;
  }, 0);
  const totalQ = round2(totalNominaQ + totalCargosQ);

  // =============================================
  // HOJA 1: NÓMINA (Detalle Actual)
  // =============================================
  const ws1 = wb.addWorksheet('Nomina');

  // Header
  ws1.mergeCells('B1:P1');
  const logo1 = ws1.getCell('B1');
  logo1.value = config.empresa.toUpperCase();
  logo1.font = { name: 'Calibri', size: 20, bold: true, color: { argb: B.white } };
  logo1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: B.darkBlue } };
  logo1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 42;

  ws1.mergeCells('B2:P2');
  const sub1 = ws1.getCell('B2');
  sub1.value = `CORRIDA FINANCIERA DE NÓMINA ${config.año}`;
  sub1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: B.primary } };
  sub1.alignment = { horizontal: 'center' };
  ws1.getRow(2).height = 26;

  ws1.mergeCells('B3:P3');
  const sub2 = ws1.getCell('B3');
  sub2.value = 'OPERACIÓN: NÓMINA  |  PERIODO: QUINCENAL';
  sub2.font = { name: 'Calibri', size: 10, color: { argb: B.gray } };
  sub2.alignment = { horizontal: 'center' };

  // Row 5: Column headers
  const empHeaders = ['#', 'Apellido Paterno', 'Apellido Materno', 'Nombre', 'Sueldo Quincenal', 'Salario Diario', 'Salario Periodo', 'Días Periodo', 'Horas Extras', 'Días Extras / Comisiones', 'Total a Pagar', 'Banco', 'No. Cuenta', 'CLABE', 'Total Mensual'];
  const hRow = ws1.getRow(5);
  empHeaders.forEach((h, i) => {
    const cell = hRow.getCell(i + 2); // Start at B
    cell.value = h;
    headerCell(cell);
  });
  hRow.height = 30;

  // Employee rows
  let r1 = 6;
  config.empleados.forEach((emp, idx) => {
    const row = ws1.getRow(r1);
    const diario = round2(emp.sueldo_quincenal / 15);
    const salarioPeriodo = round2(diario * 15);
    const totalPagar = emp.sueldo_quincenal;
    const mensual = round2(totalPagar * 2);

    textCell(row.getCell(2), String(idx + 1));
    textCell(row.getCell(3), emp.apellido_paterno);
    textCell(row.getCell(4), emp.apellido_materno);
    textCell(row.getCell(5), emp.nombre);
    moneyCell(row.getCell(6), emp.sueldo_quincenal);
    moneyCell(row.getCell(7), diario);
    moneyCell(row.getCell(8), salarioPeriodo);
    row.getCell(9).value = 15;
    row.getCell(9).alignment = { horizontal: 'center' };
    moneyCell(row.getCell(10), 0);
    moneyCell(row.getCell(11), 0);
    moneyCell(row.getCell(12), totalPagar, false, B.green);
    textCell(row.getCell(13), emp.banco);
    textCell(row.getCell(14), emp.numero_cuenta);
    textCell(row.getCell(15), emp.clabe);
    moneyCell(row.getCell(16), mensual);

    if (idx % 2 === 1) bgRow(row, 2, 16, B.lightGray);
    borderRow(row, 2, 16);
    r1++;
  });


  // Cargos extras as additional rows
  config.cargos_extras.filter(c => c.tipo === 'fijo').forEach((cargo) => {
    const row = ws1.getRow(r1);
    ws1.mergeCells(r1, 3, r1, 5);
    textCell(row.getCell(3), cargo.nombre, true);
    moneyCell(row.getCell(12), cargo.valor);
    moneyCell(row.getCell(16), round2(cargo.valor * 2));
    bgRow(row, 2, 16, B.yellow);
    borderRow(row, 2, 16);
    r1++;
  });

  r1++;

  // Summary (uses totalNominaQ and totalQ from outer scope)
  const summaryItems: [string, number][] = [
    ['Subtotal Nómina (Empleados)', totalNominaQ],
  ];
  config.cargos_extras.forEach((cargo) => {
    if (cargo.tipo === 'porcentaje') {
      summaryItems.push([`${cargo.nombre} (${cargo.valor}%)`, round2(totalNominaQ * cargo.valor / 100)]);
    } else {
      summaryItems.push([cargo.nombre, cargo.valor]);
    }
  });
  summaryItems.push(['TOTAL QUINCENAL', totalQ]);

  ws1.mergeCells(r1, 2, r1, 16);
  const sumTitle = ws1.getCell(r1, 2);
  sumTitle.value = 'RESUMEN QUINCENAL';
  sumTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: B.white } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: B.primary } };
  sumTitle.alignment = { horizontal: 'center' };
  r1++;

  summaryItems.forEach(([label, value], idx) => {
    const row = ws1.getRow(r1);
    ws1.mergeCells(r1, 2, r1, 11);
    const isTotal = idx === summaryItems.length - 1;
    textCell(row.getCell(2), label, isTotal, isTotal ? B.primary : undefined);
    moneyCell(row.getCell(12), value, isTotal, isTotal ? B.primary : undefined);
    moneyCell(row.getCell(16), round2(value * 2), isTotal, isTotal ? B.primary : undefined);
    if (isTotal) {
      bgRow(row, 2, 16, B.lightBlue);
      row.height = 24;
    }
    borderRow(row, 2, 16);
    r1++;
  });

  r1 += 2;
  ws1.mergeCells(r1, 2, r1, 16);
  const footer1 = ws1.getCell(r1, 2);
  footer1.value = `EnterHR by EnterSys  ·  Corrida Financiera ${config.año}  ·  Generado: ${new Date().toLocaleDateString('es-MX')}  ·  Confidencial`;
  footer1.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '94A3B8' } };
  footer1.alignment = { horizontal: 'center' };

  // Column widths
  ws1.getColumn(2).width = 5;
  ws1.getColumn(3).width = 20;
  ws1.getColumn(4).width = 20;
  ws1.getColumn(5).width = 20;
  ws1.getColumn(6).width = 18;
  ws1.getColumn(7).width = 15;
  ws1.getColumn(8).width = 15;
  ws1.getColumn(9).width = 12;
  ws1.getColumn(10).width = 14;
  ws1.getColumn(11).width = 16;
  ws1.getColumn(12).width = 16;
  ws1.getColumn(13).width = 16;
  ws1.getColumn(14).width = 16;
  ws1.getColumn(15).width = 22;
  ws1.getColumn(16).width = 16;

  // =============================================
  // HOJA 2: PROYECCIÓN (vista seleccionada)
  // =============================================
  const vistaData = periodos[vista];
  const subtitle = `${totalEmpleados} empleados  |  Nómina quincenal: ${formatMXN(totalQ)}  |  Vista: ${PERIODO_LABELS[vista]}`;

  addProjectionSheet(
    wb,
    `${VISTA_SHEET_NAMES[vista]} ${config.año}`,
    VISTA_TITLES[vista],
    subtitle,
    vistaData,
    cargoNames,
    config,
  );

  // Si la vista es quincenal, agregar también la mensual como hoja adicional
  if (vista === 'quincenal') {
    addProjectionSheet(
      wb,
      `Proyeccion Mensual ${config.año}`,
      'PROYECCIÓN MENSUAL DE NÓMINA',
      subtitle,
      periodos.mensual,
      cargoNames,
      config,
    );
  }
  // Si la vista es mensual, agregar también la quincenal como detalle
  if (vista === 'mensual') {
    addProjectionSheet(
      wb,
      `Detalle Quincenal ${config.año}`,
      'DETALLE QUINCENAL DE NÓMINA',
      subtitle,
      periodos.quincenal,
      cargoNames,
      config,
    );
  }

  // Download
  const vistaLabel = PERIODO_LABELS[vista];
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.empresa}_Corrida_Financiera_${vistaLabel}_${config.año}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
