import type { ParsedTable } from "./csv-parser";

export interface ExcelTable extends ParsedTable {
  sheetCount: number;
}

/**
 * Parse an Excel (.xlsx / .xls) file into the same ParsedTable shape as csv-parser.
 * Uses read-excel-file (client-side only).
 */
export async function parseExcel(file: File, sheetIndex = 0): Promise<ExcelTable> {
  const { readSheet } = await import("read-excel-file/browser");

  // readSheet reads a specific sheet by index (1-based)
  const sheetData = await readSheet(file, sheetIndex + 1);

  if (!sheetData || sheetData.length === 0) return { headers: [], rows: [], sheetCount: 1 };

  const rows = sheetData;

  const headers = rows[0].map(cell => String(cell ?? ""));
  const dataRows = rows.slice(1).map(row => row.map(cell => String(cell ?? "")));

  return { headers, rows: dataRows, sheetCount: 1 };
}

/** Get sheet names from an Excel file (read-excel-file returns 1 sheet in browser API) */
export async function getSheetNames(_file: File): Promise<string[]> {
  return ["Sheet 1"];
}
