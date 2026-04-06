"use client";

import { useState, useRef } from "react";
import {
  matchImagesToProducts,
  filterImageFiles,
  type ImageMatch,
  type MatchConfidence,
} from "@/lib/utils/image-utils";
import { uploadProductImage } from "@/app/actions/products";
import type { DbProduct } from "@/types/database";

interface Props {
  tenantId: string;
  products: DbProduct[];
}

type Stage = "upload" | "review" | "importing" | "done";

interface AIMatch {
  filename:   string;
  productId:  string;
  sku:        string;
  confidence: number;
  reason:     string;
}

// Confidence badge colours
const CONFIDENCE_STYLE: Record<MatchConfidence, { label: string; color: string; bg: string }> = {
  exact:  { label: "Exact",  color: "#166534", bg: "#dcfce7" },
  jcode:  { label: "J-code", color: "#1e40af", bg: "#dbeafe" },
  prefix: { label: "Prefix", color: "#92400e", bg: "#fef3c7" },
  none:   { label: "None",   color: "#991b1b", bg: "#fee2e2" },
};

export default function ImageImporter({ tenantId, products }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const folderRef  = useRef<HTMLInputElement>(null);

  const [stage,    setStage]    = useState<Stage>("upload");
  const [matches,  setMatches]  = useState<ImageMatch[]>([]);
  const [error,    setError]    = useState<string | null>(null);

  // Manual overrides: filename → productId
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  // AI suggestions: filename → AIMatch
  const [aiSuggestions, setAISuggestions] = useState<Record<string, AIMatch>>({});
  const [aiLoading,  setAILoading]  = useState(false);
  const [aiError,    setAIError]    = useState<string | null>(null);

  // Upload progress
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFiles(files: FileList | File[]) {
    const images = filterImageFiles(Array.from(files));
    if (images.length === 0) { setError("No image files found."); return; }
    const m = matchImagesToProducts(
      images,
      products.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
    );
    setMatches(m);
    setOverrides({});
    setAISuggestions({});
    setAIError(null);
    setError(null);
    setStage("review");
  }

  // ── AI matching for unmatched files ──────────────────────────────────────
  async function handleAIMatch() {
    const unmatched = matches.filter(m => !m.matched && !overrides[m.file.name]);
    if (unmatched.length === 0) return;

    setAILoading(true);
    setAIError(null);
    try {
      const res = await fetch("/api/ai/match-images", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          filenames: unmatched.map(m => m.file.name),
          products:  products.map(p => ({ id: p.id, sku: p.sku, name: p.name })),
          tenantId,
        }),
      });
      const data = await res.json() as { matches?: AIMatch[]; error?: string };
      if (data.error) { setAIError(data.error); return; }

      const map: Record<string, AIMatch> = {};
      for (const match of data.matches ?? []) {
        map[match.filename] = match;
      }
      setAISuggestions(map);
    } catch (e) {
      setAIError(e instanceof Error ? e.message : "AI matching failed");
    } finally {
      setAILoading(false);
    }
  }

  // ── Import ────────────────────────────────────────────────────────────────
  async function handleImport() {
    // Build final assignment list
    const toUpload: { match: ImageMatch; productId: string }[] = [];

    for (const m of matches) {
      let productId: string | undefined;

      if (m.matched && m.matchedProductId) {
        productId = m.matchedProductId;
      } else if (overrides[m.file.name]) {
        productId = overrides[m.file.name];
      } else if (aiSuggestions[m.file.name]) {
        productId = aiSuggestions[m.file.name].productId;
      }

      if (productId) toUpload.push({ match: m, productId });
    }

    if (toUpload.length === 0) return;

    setStage("importing");
    setProgress({ done: 0, total: toUpload.length, errors: 0 });

    for (const { match, productId } of toUpload) {
      const product = products.find(p => p.id === productId);
      if (!product) {
        setProgress(p => ({ ...p, errors: p.errors + 1, done: p.done + 1 }));
        continue;
      }

      const result = await uploadProductImage(
        match.file,
        productId,
        tenantId,
        product.images ?? []
      );

      setProgress(p => ({
        done:   p.done + 1,
        total:  p.total,
        errors: p.errors + (result.error ? 1 : 0),
      }));
    }

    setStage("done");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <p className="importer__drop-icon">🖼</p>
          <p className="importer__drop-text">
            Drop image files or a folder here
          </p>
          <p className="importer__drop-hint">
            Supported filename patterns:<br />
            <code className="importer__code">J068225_000.jpg</code> &nbsp;·&nbsp;
            <code className="importer__code">J068225-BLK_000.jpg</code> &nbsp;·&nbsp;
            <code className="importer__code">J068225.jpg</code><br />
            Angle codes: 000/001=main · 045=angle · 180=side · 270=back · OUT=outsole
          </p>
          <div className="importer__drop-btns">
            <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
              Select images
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => folderRef.current?.click()}>
              Select folder
            </button>
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }}
          onChange={e => { if (e.target.files) handleFiles(e.target.files); }} />
        {/* webkitdirectory for folder selection */}
        <input ref={folderRef} type="file" accept="image/*" multiple
          // @ts-expect-error webkitdirectory is not in TS types
          webkitdirectory=""
          style={{ display: "none" }}
          onChange={e => { if (e.target.files) handleFiles(e.target.files); }} />

        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (stage === "importing") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="importer importer--progress">
        <p className="importer__info">Uploading images… {progress.done} / {progress.total}</p>
        <div className="importer__progress-bar">
          <div className="importer__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {progress.errors > 0 && (
          <p className="form-error">{progress.errors} upload{progress.errors > 1 ? "s" : ""} failed</p>
        )}
      </div>
    );
  }

  if (stage === "done") {
    const succeeded = progress.done - progress.errors;
    return (
      <div className="importer importer--done">
        <p className="importer__success">
          {succeeded} image{succeeded !== 1 ? "s" : ""} uploaded successfully.
          {progress.errors > 0 && ` (${progress.errors} failed)`}
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => { setStage("upload"); setMatches([]); setOverrides({}); setAISuggestions({}); }}
        >
          Import more images
        </button>
      </div>
    );
  }

  // ── Review stage ──────────────────────────────────────────────────────────
  const matched   = matches.filter(m => m.matched);
  const unmatched = matches.filter(m => !m.matched);
  const aiResolved = unmatched.filter(m => aiSuggestions[m.file.name]);
  const stillUnmatched = unmatched.filter(m => !aiSuggestions[m.file.name]);

  const totalAssigned =
    matched.length +
    aiResolved.filter(m => !overrides[m.file.name] || overrides[m.file.name]).length +
    Object.values(overrides).filter(Boolean).length;

  return (
    <div className="importer">
      {/* Summary bar */}
      <div className="img-import-summary">
        <span className="img-import-summary__stat img-import-summary__stat--good">
          {matched.length} auto-matched
        </span>
        {aiResolved.length > 0 && (
          <span className="img-import-summary__stat img-import-summary__stat--ai">
            {aiResolved.length} AI-matched
          </span>
        )}
        {stillUnmatched.length > 0 && (
          <span className="img-import-summary__stat img-import-summary__stat--warn">
            {stillUnmatched.length} unmatched
          </span>
        )}
        <span className="img-import-summary__total">{matches.length} total</span>
      </div>

      {/* Auto-matched */}
      {matched.length > 0 && (
        <div className="image-match-list">
          <p className="image-match-list__title">Auto-matched ({matched.length})</p>
          {matched.map((m, i) => {
            const conf = CONFIDENCE_STYLE[m.confidence];
            return (
              <div key={i} className="image-match-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.objectUrl} alt={m.file.name} className="image-match-row__thumb" />
                <div className="image-match-row__info">
                  <span className="image-match-row__filename">{m.file.name}</span>
                  <span className="image-match-row__product">{m.matchedProductName}</span>
                </div>
                <span className="image-match-row__angle">{m.angle}</span>
                <span
                  className="image-match-row__badge"
                  style={{ color: conf.color, background: conf.bg }}
                >
                  {conf.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Unmatched — with AI button */}
      {unmatched.length > 0 && (
        <div className="image-match-list">
          <div className="image-match-list__header">
            <p className="image-match-list__title">
              Unmatched ({unmatched.length})
            </p>
            {stillUnmatched.length > 0 && (
              <button
                type="button"
                className="btn btn--ghost image-match-list__ai-btn"
                disabled={aiLoading}
                onClick={handleAIMatch}
              >
                {aiLoading ? "Analysing…" : "✦ AI match"}
              </button>
            )}
          </div>
          {aiError && <p className="form-error">{aiError}</p>}

          {unmatched.map((m, i) => {
            const aiHit = aiSuggestions[m.file.name];
            const override = overrides[m.file.name];
            return (
              <div key={i} className="image-match-row image-match-row--unmatched">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.objectUrl} alt={m.file.name} className="image-match-row__thumb" />
                <div className="image-match-row__info">
                  <span className="image-match-row__filename">{m.file.name}</span>
                  {aiHit && !override && (
                    <span className="image-match-row__ai-hint">
                      ✦ AI: {aiHit.sku} — {aiHit.reason}
                    </span>
                  )}
                </div>
                <select
                  className="settings-input image-match-row__assign"
                  value={override ?? (aiHit ? aiHit.productId : "")}
                  onChange={e => setOverrides(prev => ({ ...prev, [m.file.name]: e.target.value }))}
                >
                  <option value="">Skip</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      <div className="importer__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setStage("upload")}>Back</button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={totalAssigned === 0}
          onClick={handleImport}
        >
          Upload {totalAssigned} image{totalAssigned !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
