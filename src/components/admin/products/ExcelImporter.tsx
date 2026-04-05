"use client";

import { useState } from "react";
import { parseExcel } from "@/lib/utils/excel-parser";
import { importProducts } from "@/app/actions/products";
import ColumnMapper, { type ColumnMap, applyMapping } from "./ColumnMapper";
import ProgressBar from "@/components/ui/ProgressBar";

interface ExcelImporterProps {
  tenantId: string;
}

type Stage = "upload" | "sheet" | "map" | "importing" | "done";

export default function ExcelImporter({ tenantId }: ExcelImporterProps) {
  const [stage, setStage]           = useState<Stage>("upload");
  const [file, setFile]             = useState<File | null>(null);
  const [sheetCount, setSheetCount] = useState(1);
  const [sheetIdx, setSheetIdx]     = useState(0);
  const [headers, setHeaders]       = useState<string[]>([]);
  const [rows, setRows]             = useState<string[][]>([]);
  const [mapping, setMapping]       = useState<ColumnMap>({});
  const [progress, setProgress]     = useState(0);
  const [result, setResult]         = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError]           = useState<string | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    try {
      const parsed = await parseExcel(f, 0);
      setSheetCount(parsed.sheetCount ?? 1);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      if ((parsed.sheetCount ?? 1) > 1) {
        setStage("sheet");
      } else {
        autoMapAndAdvance(parsed.headers);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function loadSheet(idx: number) {
    if (!file) return;
    try {
      const parsed = await parseExcel(file, idx);
      setSheetIdx(idx);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      autoMapAndAdvance(parsed.headers);
    } catch (e) {
      setError(String(e));
    }
  }

  function autoMapAndAdvance(hdrs: string[]) {
    const autoMap: ColumnMap = {};
    hdrs.forEach(h => {
      const lower = h.toLowerCase().trim();
      if (lower === "name" || lower === "product name") autoMap[h] = "name";
      else if (lower === "sku" || lower === "article number") autoMap[h] = "sku";
      else if (lower === "description" || lower === "desc") autoMap[h] = "description";
      else if (lower === "price") autoMap[h] = "price";
      else if (lower === "currency") autoMap[h] = "currency";
      else if (lower === "category") autoMap[h] = "category";
      else if (lower === "subcategory") autoMap[h] = "subcategory";
      else if (lower === "tags") autoMap[h] = "tags";
      else if (lower === "status") autoMap[h] = "status";
      else autoMap[h] = "__skip__";
    });
    setMapping(autoMap);
    setStage("map");
  }

  async function handleImport() {
    setStage("importing");
    setProgress(10);
    const importRows = rows.map(row => {
      const mapped = applyMapping(headers, row, mapping);
      return {
        name:        mapped.name ?? "",
        sku:         mapped.sku ?? "",
        description: mapped.description,
        price:       mapped.price ? parseFloat(mapped.price) : undefined,
        currency:    mapped.currency,
        category:    mapped.category,
        subcategory: mapped.subcategory,
        tags:        mapped.tags ? mapped.tags.split(",").map((t: string) => t.trim()) : undefined,
        status:      (mapped.status as "draft" | "active") ?? "draft",
      };
    }).filter(r => r.name && r.sku);

    setProgress(40);
    const res = await importProducts(tenantId, importRows);
    setProgress(100);
    setResult(res);
    setStage("done");
  }

  function reset() {
    setStage("upload");
    setFile(null);
    setSheetCount(1);
    setSheetIdx(0);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setProgress(0);
    setResult(null);
    setError(null);
  }

  if (stage === "upload") {
    return (
      <div className="importer">
        <div
          className="importer__drop"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <p className="importer__drop-text">Drag an Excel (.xlsx) file here, or</p>
          <label className="btn btn--ghost">
            Browse
            <input
              type="file"
              accept=".xlsx"
              className="importer__file-input"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (stage === "sheet") {
    return (
      <div className="importer">
        <p className="importer__info">This workbook has {sheetCount} sheets. Select one to import:</p>
        <div className="importer__sheet-list">
          {Array.from({ length: sheetCount }, (_, i) => (
            <button key={i} type="button" className="btn btn--ghost" onClick={() => loadSheet(i)}>
              Sheet {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "map") {
    const missing = !Object.values(mapping).includes("name") || !Object.values(mapping).includes("sku");
    return (
      <div className="importer">
        <p className="importer__info">{rows.length} rows detected</p>
        <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} />
        {missing && <p className="form-error">Map at least Name and SKU to continue.</p>}
        <div className="importer__actions">
          <button type="button" className="btn btn--ghost" onClick={reset}>Back</button>
          <button type="button" className="btn btn--primary" disabled={missing} onClick={handleImport}>
            Import {rows.length} products
          </button>
        </div>
      </div>
    );
  }

  if (stage === "importing") {
    return (
      <div className="importer">
        <ProgressBar value={progress} label="Importing products" />
      </div>
    );
  }

  return (
    <div className="importer importer--done">
      <p className="importer__success">Imported {result?.imported} products</p>
      {result?.errors && result.errors.length > 0 && (
        <ul className="importer__errors">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
      <button type="button" className="btn btn--ghost" onClick={reset}>Import another file</button>
    </div>
  );
}
