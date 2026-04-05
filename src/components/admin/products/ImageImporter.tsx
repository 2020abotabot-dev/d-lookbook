"use client";

import { useState, useRef } from "react";
import { matchImagesToProducts, filterImageFiles, type ImageMatch } from "@/lib/utils/image-utils";
import { updateProduct } from "@/app/actions/products";
import type { DbProduct } from "@/types/database";

interface ImageImporterProps {
  tenantId: string;
  products: DbProduct[];
}

type Stage = "upload" | "review" | "done";

export default function ImageImporter({ tenantId, products }: ImageImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage]         = useState<Stage>("upload");
  const [matches, setMatches]     = useState<ImageMatch[]>([]);
  const [importing, setImporting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError]         = useState<string | null>(null);
  // manual override: file name → SKU to assign to
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  function handleFiles(files: FileList) {
    const images = filterImageFiles(Array.from(files));
    if (images.length === 0) { setError("No image files found."); return; }
    const m = matchImagesToProducts(
      images,
      products.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
    );
    setMatches(m);
    setError(null);
    setStage("review");
  }

  async function handleImport() {
    setImporting(true);
    let count = 0;

    for (const m of matches) {
      const targetSku = m.matched
        ? m.sku
        : (overrides[m.file.name] ?? null);

      if (!targetSku) continue;
      const product = products.find(p => p.sku.toUpperCase() === targetSku.toUpperCase());
      if (!product) continue;

      const url = URL.createObjectURL(m.file);
      await updateProduct(product.id, tenantId, {
        images: [...product.images, url],
      });
      count++;
    }

    setDoneCount(count);
    setImporting(false);
    setStage("done");
  }

  if (stage === "upload") {
    return (
      <div className="importer">
        <div
          className="importer__drop"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
        >
          <p className="importer__drop-text">
            Drop image files here. Filename convention:&nbsp;
            <code className="importer__code">SKU_000.jpg</code>
            &nbsp;(000=main, 045=angle, 180=side, 270=back, OUT=outsole)
          </p>
          <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
            Browse images
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="importer__file-input"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
        />
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (stage === "review") {
    const matched   = matches.filter(m => m.matched);
    const unmatched = matches.filter(m => !m.matched);

    return (
      <div className="importer">
        <p className="importer__info">
          {matched.length} matched &mdash; {unmatched.length} unmatched
        </p>

        {matched.length > 0 && (
          <div className="image-match-list">
            <p className="image-match-list__title">Matched</p>
            {matched.map((m, i) => (
              <div key={i} className="image-match-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.objectUrl} alt={m.file.name} className="image-match-row__thumb" />
                <span className="image-match-row__filename">{m.file.name}</span>
                <span className="image-match-row__product">{m.sku}</span>
                <span className="image-match-row__angle">{m.angle}</span>
              </div>
            ))}
          </div>
        )}

        {unmatched.length > 0 && (
          <div className="image-match-list">
            <p className="image-match-list__title">Unmatched — assign manually</p>
            {unmatched.map((m, i) => (
              <div key={i} className="image-match-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.objectUrl} alt={m.file.name} className="image-match-row__thumb" />
                <span className="image-match-row__filename">{m.file.name}</span>
                <select
                  className="settings-input image-match-row__assign"
                  value={overrides[m.file.name] ?? ""}
                  onChange={e => setOverrides(prev => ({ ...prev, [m.file.name]: e.target.value }))}
                >
                  <option value="">Skip</option>
                  {products.map(p => (
                    <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="importer__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setStage("upload")}>Back</button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={importing || (matched.length === 0 && Object.keys(overrides).length === 0)}
            onClick={handleImport}
          >
            {importing ? "Uploading…" : `Upload ${matched.length + Object.keys(overrides).filter(k => overrides[k]).length} images`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="importer importer--done">
      <p className="importer__success">Assigned {doneCount} images</p>
      <button type="button" className="btn btn--ghost" onClick={() => { setStage("upload"); setMatches([]); setOverrides({}); }}>
        Import more images
      </button>
    </div>
  );
}
