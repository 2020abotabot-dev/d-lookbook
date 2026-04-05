"use client";

import { useState, useRef } from "react";
import { parseCSV, readFileAsText } from "@/lib/utils/csv-parser";
import { parseExcel } from "@/lib/utils/excel-parser";
import { importProducts } from "@/app/actions/products";
import ColumnMapper, { type ColumnMap, applyMapping } from "./ColumnMapper";
import ProgressBar from "@/components/ui/ProgressBar";

interface FolderImporterProps {
  tenantId: string;
}

type Stage = "upload" | "select" | "map" | "importing" | "done";

export default function FolderImporter({ tenantId }: FolderImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage]         = useState<Stage>("upload");
  const [dataFiles, setDataFiles] = useState<File[]>([]);
  const [selected, setSelected]   = useState<File | null>(null);
  const [headers, setHeaders]     = useState<string[]>([]);
  const [rows, setRows]           = useState<string[][]>([]);
  const [mapping, setMapping]     = useState<ColumnMap>({});
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function handleFolder(files: FileList) {
    const dataF = Array.from(files).filter(
      f => f.name.endsWith(".csv") || f.name.endsWith(".xlsx")
    );
    if (dataF.length === 0) {
      setError("No CSV or Excel files found in the selected folder.");
      return;
    }
    setDataFiles(dataF);
    setStage("select");
    setError(null);
  }

  async function selectFile(file: File) {
    setSelected(file);
    try {
      let parsed: { headers: string[]; rows: string[][] };
      if (file.name.endsWith(".csv")) {
        const text = await readFileAsText(file);
        parsed = parseCSV(text);
      } else {
        const r = await parseExcel(file, 0);
        parsed = r;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      const autoMap: ColumnMap = {};
      parsed.headers.forEach(h => {
        const lower = h.toLowerCase().trim();
        if (lower === "name" || lower === "product name") autoMap[h] = "name";
        else if (lower === "sku" || lower === "article number") autoMap[h] = "sku";
        else if (lower === "description") autoMap[h] = "description";
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
    } catch (e) {
      setError(String(e));
    }
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
    setDataFiles([]);
    setSelected(null);
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
        <p className="importer__drop-text">Select a folder containing CSV or Excel files</p>
        <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
          Browse folder
        </button>
        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error webkitdirectory is not in standard types
          webkitdirectory=""
          multiple
          className="importer__file-input"
          onChange={e => { if (e.target.files) handleFolder(e.target.files); }}
        />
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (stage === "select") {
    return (
      <div className="importer">
        <p className="importer__info">Found {dataFiles.length} data file(s). Select one to import:</p>
        <div className="importer__file-list">
          {dataFiles.map(f => (
            <button key={f.name} type="button" className="btn btn--ghost" onClick={() => selectFile(f)}>
              {f.name}
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
        <p className="importer__info">{rows.length} rows in {selected?.name}</p>
        <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} />
        {missing && <p className="form-error">Map at least Name and SKU to continue.</p>}
        <div className="importer__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setStage("select")}>Back</button>
          <button type="button" className="btn btn--primary" disabled={missing} onClick={handleImport}>
            Import {rows.length} products
          </button>
        </div>
      </div>
    );
  }

  if (stage === "importing") {
    return <div className="importer"><ProgressBar value={progress} label="Importing products" /></div>;
  }

  return (
    <div className="importer importer--done">
      <p className="importer__success">Imported {result?.imported} products</p>
      {result?.errors && result.errors.length > 0 && (
        <ul className="importer__errors">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
      <button type="button" className="btn btn--ghost" onClick={reset}>Import another folder</button>
    </div>
  );
}
