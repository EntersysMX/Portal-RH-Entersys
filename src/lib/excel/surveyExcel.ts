// ============================================
// ENCUESTAS: PLANTILLA EXCEL + PARSER
// ============================================

import ExcelJS from 'exceljs';
import type { Survey, SurveyQuestion } from '@/types/frappe';

// ---- Branding (reusa colores de excelGenerator) ----
const BRAND = {
  primary: '2563EB',
  primaryDark: '1E40AF',
  headerBg: '1E3A5F',
  headerText: 'FFFFFF',
  sectionBg: 'EFF6FF',
  altRow: 'F8FAFC',
  border: 'CBD5E1',
  accent: '7C3AED',
  lightPurple: 'F5F3FF',
};

const today = () =>
  new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

async function triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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
// DESCARGAR PLANTILLA
// ============================================

export async function downloadSurveyTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EnterHR by EnterSys';
  wb.created = new Date();

  // --- Hoja 1: Instrucciones ---
  const wsInst = wb.addWorksheet('Instrucciones');

  // Brand header
  wsInst.mergeCells(1, 1, 1, 3);
  const logoCell = wsInst.getCell('A1');
  logoCell.value = 'EnterHR by EnterSys';
  logoCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: BRAND.headerText } };
  logoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerBg } };
  logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsInst.getRow(1).height = 40;

  wsInst.mergeCells(2, 1, 2, 3);
  const titleCell = wsInst.getCell('A2');
  titleCell.value = 'Plantilla de Carga Masiva de Encuestas';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: BRAND.primary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsInst.getRow(2).height = 28;

  wsInst.mergeCells(3, 1, 3, 3);
  const subCell = wsInst.getCell('A3');
  subCell.value = `Instrucciones de llenado  |  Generado: ${today()}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const instrucciones = [
    '',
    'INSTRUCCIONES:',
    '1. Llene los datos en la hoja "Encuestas", una PREGUNTA por fila.',
    '2. Las filas con el mismo "titulo_encuesta" se agrupan en UNA sola encuesta.',
    '3. Campos obligatorios: titulo_encuesta, pregunta, tipo_pregunta.',
    '4. tipo_pregunta acepta: abierta, opcion_multiple, likert.',
    '5. Para opcion_multiple, separe las opciones con coma en la columna "opciones".',
    '6. es_anonima acepta: Si o No (por defecto No).',
    '7. obligatoria acepta: Si o No (por defecto No).',
    '8. fecha_vencimiento en formato AAAA-MM-DD.',
    '',
    'EJEMPLO:',
    'Si tiene 2 encuestas, una con 3 preguntas y otra con 1, serán 4 filas.',
    'Las 3 filas con el mismo titulo_encuesta se agrupan automáticamente.',
  ];

  instrucciones.forEach((text, idx) => {
    const r = wsInst.getRow(5 + idx);
    r.getCell(1).value = text;
    if (text === 'INSTRUCCIONES:' || text === 'EJEMPLO:') {
      r.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: BRAND.primary } };
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionBg } };
    } else {
      r.getCell(1).font = { name: 'Calibri', size: 10 };
    }
  });

  wsInst.getColumn(1).width = 80;
  wsInst.getColumn(2).width = 20;
  wsInst.getColumn(3).width = 20;

  // --- Hoja 2: Encuestas (datos) ---
  const wsData = wb.addWorksheet('Encuestas');

  // Brand header
  wsData.mergeCells(1, 1, 1, 8);
  const dataLogo = wsData.getCell('A1');
  dataLogo.value = 'EnterHR  —  Carga Masiva de Encuestas';
  dataLogo.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BRAND.headerText } };
  dataLogo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerBg } };
  dataLogo.alignment = { horizontal: 'center', vertical: 'middle' };
  wsData.getRow(1).height = 38;

  // Column headers (row 2)
  const headers = [
    'titulo_encuesta',
    'tipo',
    'es_anonima',
    'fecha_vencimiento',
    'pregunta',
    'tipo_pregunta',
    'opciones',
    'obligatoria',
  ];
  const headerRow = wsData.getRow(2);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: BRAND.primaryDark } } };
  });
  headerRow.height = 28;

  // Example rows (row 3-5)
  const examples = [
    ['Clima Q1 2026', 'Clima Laboral', 'Si', '2026-04-30', 'Como calificas el ambiente?', 'likert', '', 'Si'],
    ['Clima Q1 2026', 'Clima Laboral', 'Si', '2026-04-30', 'Que mejorarias?', 'abierta', '', 'No'],
    ['Satisfaccion', 'General', 'No', '', 'Nivel de satisfaccion', 'opcion_multiple', 'Muy satisfecho,Satisfecho,Neutral,Insatisfecho', 'Si'],
  ];
  examples.forEach((row, rowIdx) => {
    const r = wsData.getRow(3 + rowIdx);
    row.forEach((val, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '6B7280' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
    });
  });

  // Data validation for tipo_pregunta (col 6) and tipo (col 2)
  for (let r = 3; r <= 102; r++) {
    wsData.getCell(r, 6).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"abierta,opcion_multiple,likert"'],
      showErrorMessage: true,
      errorTitle: 'Tipo no valido',
      error: 'Use: abierta, opcion_multiple o likert',
    };
    wsData.getCell(r, 2).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"General,Clima Laboral,Satisfaccion,Salida,Otro"'],
    };
    wsData.getCell(r, 3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Si,No"'],
    };
    wsData.getCell(r, 8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Si,No"'],
    };
  }

  // Pre-format empty rows
  for (let r = 6; r <= 102; r++) {
    const row = wsData.getRow(r);
    const isAlt = (r - 6) % 2 === 1;
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = { bottom: { style: 'hair', color: { argb: BRAND.border } } };
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.altRow } };
      }
    }
  }

  // Column widths
  wsData.getColumn(1).width = 28;
  wsData.getColumn(2).width = 18;
  wsData.getColumn(3).width = 14;
  wsData.getColumn(4).width = 20;
  wsData.getColumn(5).width = 40;
  wsData.getColumn(6).width = 20;
  wsData.getColumn(7).width = 45;
  wsData.getColumn(8).width = 14;

  // Freeze
  wsData.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }];

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `EnterHR_Plantilla_Encuestas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================
// PARSER
// ============================================

export interface ParsedSurvey {
  title: string;
  survey_type: Survey['survey_type'];
  is_anonymous: boolean;
  end_date: string;
  questions: SurveyQuestion[];
}

export interface SurveyParseResult {
  surveys: ParsedSurvey[];
  errors: string[];
}

function cellToString(cell: ExcelJS.Cell): string {
  const val = cell.value;
  if (val == null) return '';
  if (typeof val === 'object' && 'text' in val) return String(val.text).trim();
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

const VALID_QUESTION_TYPES = ['abierta', 'opcion_multiple', 'likert'];
const QUESTION_TYPE_MAP: Record<string, SurveyQuestion['question_type']> = {
  abierta: 'open',
  opcion_multiple: 'multiple_choice',
  likert: 'likert',
};

const SURVEY_TYPE_MAP: Record<string, Survey['survey_type']> = {
  'General': 'General',
  'Clima Laboral': 'Clima Laboral',
  'Satisfaccion': 'Satisfacción',
  'Satisfacci\u00f3n': 'Satisfacción',
  'Salida': 'Salida',
  'Otro': 'Otro',
};

export async function parseSurveyExcel(file: File): Promise<SurveyParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet('Encuestas');
  if (!ws) {
    return { surveys: [], errors: ['No se encontro la hoja "Encuestas". Use la plantilla oficial.'] };
  }

  const errors: string[] = [];
  const grouped = new Map<string, {
    type: string;
    anonymous: boolean;
    endDate: string;
    questions: SurveyQuestion[];
  }>();

  const DATA_START = 3; // headers on row 2
  const lastRow = ws.rowCount;

  for (let r = DATA_START; r <= lastRow; r++) {
    const row = ws.getRow(r);

    const titulo = cellToString(row.getCell(1));
    const pregunta = cellToString(row.getCell(5));

    // Skip empty rows
    if (!titulo && !pregunta) continue;

    if (!titulo) {
      errors.push(`Fila ${r}: falta titulo_encuesta`);
      continue;
    }
    if (!pregunta) {
      errors.push(`Fila ${r}: falta pregunta`);
      continue;
    }

    const tipoPreguntaRaw = cellToString(row.getCell(6)).toLowerCase();
    if (!VALID_QUESTION_TYPES.includes(tipoPreguntaRaw)) {
      errors.push(`Fila ${r}: tipo_pregunta "${tipoPreguntaRaw}" no valido (use: abierta, opcion_multiple, likert)`);
      continue;
    }

    const opciones = cellToString(row.getCell(7));
    if (tipoPreguntaRaw === 'opcion_multiple' && !opciones) {
      errors.push(`Fila ${r}: opcion_multiple requiere columna "opciones" (separadas por coma)`);
      continue;
    }

    const tipo = cellToString(row.getCell(2));
    const esAnonima = cellToString(row.getCell(3)).toLowerCase();
    const fechaVenc = cellToString(row.getCell(4));
    const obligatoria = cellToString(row.getCell(8)).toLowerCase();

    if (!grouped.has(titulo)) {
      grouped.set(titulo, {
        type: tipo,
        anonymous: esAnonima === 'si' || esAnonima === 'sí',
        endDate: fechaVenc,
        questions: [],
      });
    }

    const group = grouped.get(titulo)!;
    group.questions.push({
      idx: group.questions.length + 1,
      question_text: pregunta,
      question_type: QUESTION_TYPE_MAP[tipoPreguntaRaw],
      options: opciones || undefined,
      required: obligatoria === 'si' || obligatoria === 'sí',
    });
  }

  const surveys: ParsedSurvey[] = [];
  for (const [title, data] of grouped) {
    surveys.push({
      title,
      survey_type: SURVEY_TYPE_MAP[data.type] || 'General',
      is_anonymous: data.anonymous,
      end_date: data.endDate,
      questions: data.questions,
    });
  }

  return { surveys, errors };
}
