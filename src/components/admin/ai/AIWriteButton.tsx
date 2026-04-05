"use client";

import { useState } from "react";
import type { GeneratedCopy } from "@/lib/ai/schemas";

interface Props {
  tenantId:    string;
  productName: string;
  features?:   string[];
  category?:   string;
  onApply:     (copy: GeneratedCopy) => void;
}

export default function AIWriteButton({ tenantId, productName, features, category, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedCopy | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId, productName, features, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPreview(data as GeneratedCopy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-write-panel">
      <button
        type="button"
        className="ai-write-btn"
        onClick={generate}
        disabled={loading}
      >
        {loading ? (
          <span className="ai-spinner" />
        ) : (
          <>
            <span className="ai-icon">✦</span>
            AI Write
          </>
        )}
      </button>

      {error && <p className="ai-error">{error}</p>}

      {preview && (
        <div className="ai-preview">
          <p className="ai-preview-label">Short</p>
          <p className="ai-preview-text">{preview.short}</p>
          <p className="ai-preview-label">Long</p>
          <p className="ai-preview-text">{preview.long}</p>
          <div className="ai-preview-actions">
            <button type="button" className="ai-apply-btn" onClick={() => { onApply(preview); setPreview(null); }}>
              Apply
            </button>
            <button type="button" className="ai-discard-btn" onClick={() => setPreview(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
