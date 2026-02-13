// ============================================
// GOOGLE SHEETS API V4 CLIENT
// ============================================

import type { GoogleSheet, SheetInfo } from './types';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Extrae el spreadsheet ID de una URL de Google Sheets.
 * Soporta formatos: /spreadsheets/d/{id}/... o solo el ID directo.
 */
export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();

  // Intentar extraer de URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];

  // Si parece un ID directo (alfanumerico con guiones)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Obtiene metadata de un spreadsheet (titulo, hojas, etc.)
 */
export async function fetchSpreadsheetMeta(
  token: string,
  spreadsheetId: string
): Promise<GoogleSheet> {
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${res.status} al obtener metadata del spreadsheet`);
  }

  const data = await res.json();

  const sheets: SheetInfo[] = (data.sheets || []).map((s: { properties: { sheetId: number; title: string; gridProperties?: { rowCount: number } } }) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount || 0,
  }));

  return {
    spreadsheetId,
    title: data.properties?.title || 'Sin titulo',
    sheets,
  };
}

/**
 * Obtiene los datos de una hoja (valores).
 * La primera fila se considera headers.
 */
export async function fetchSheetData(
  token: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const range = encodeURIComponent(sheetTitle);
  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${res.status} al obtener datos de la hoja`);
  }

  const data = await res.json();
  const values: string[][] = data.values || [];

  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = detectHeaders(values[0]);
  const rows = parseSheetRows(headers, values.slice(1));

  return { headers, rows };
}

/**
 * Extrae y limpia nombres de columnas de la primera fila.
 */
export function detectHeaders(firstRow: string[]): string[] {
  return firstRow.map((h) => (h || '').toString().trim()).filter((h) => h.length > 0);
}

/**
 * Convierte filas a objetos Record<header, valor>.
 * Ignora filas completamente vacias.
 */
export function parseSheetRows(
  headers: string[],
  rows: string[][]
): Record<string, string>[] {
  return rows
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = (row[i] || '').toString().trim();
      });
      return obj;
    })
    .filter((obj) => Object.values(obj).some((v) => v.length > 0));
}

