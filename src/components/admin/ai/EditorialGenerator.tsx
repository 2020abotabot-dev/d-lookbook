"use client";

import { useState } from "react";
import type { GeneratedEditorial } from "@/lib/ai/schemas";

interface Props {
  tenantId:     string;
  sectionTitle: string;
  onApply:      (editorial: GeneratedEditorial) => void;
}

export default function EditorialGenerator({ tenantId, sectionTitle, onApply }: Props) {
  const [open,    setOpen]    = useState(false);
  const [context, setContext] = useState("");
  const [tone,    setTone]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedEditorial | null>(null);

  async function generate() {
    if (!context.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-editorial", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId, sectionTitle, collectionContext: context, brandTone: tone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPreview(data as GeneratedEditorial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ai-write-btn ai-write-btn--sm" onClick={() => setOpen(true)}>
        <span className="ai-icon">✦</span>
        Write with AI
      </button>
    );
  }

  return (
    <div className="ai-editorial-panel">
      <div className="ai-editorial-header">
        <span className="ai-icon">✦</span>
        <strong>Generate Editorial Copy</strong>
        <button type="button" className="ai-close" onClick={() => setOpen(false)}>✕</button>
      </div>

      <textarea
        className="ai-context-input"
        placeholder="Describe the collection or campaign context… e.g. 'Spring trail running, freedom of movement, technical yet elegant'"
        value={context}
        onChange={e => setContext(e.target.value)}
        rows={3}
      />

      <input
        className="ai-tone-input"
        placeholder="Brand tone (optional) — e.g. bold, minimal, technical"
        value={tone}
        onChange={e => setTone(e.target.value)}
      />

      <button
        type="button"
        className="ai-generate-btn"
        onClick={generate}
        disabled={loading || !context.trim()}
      >
        {loading ? <span className="ai-spinner" /> : "Generate"}
      </button>

      {error && <p className="ai-error">{error}</p>}

      {preview && (
        <div className="ai-preview">
          <p className="ai-preview-label">Headline</p>
          <p className="ai-preview-text ai-preview-headline">{preview.headline}</p>
          {preview.subline && (
            <>
              <p className="ai-preview-label">Subline</p>
              <p className="ai-preview-text">{preview.subline}</p>
            </>
          )}
          <p className="ai-preview-label">Body</p>
          <p className="ai-preview-text">{preview.body}</p>
          <div className="ai-preview-actions">
            <button type="button" className="ai-apply-btn" onClick={() => { onApply(preview); setOpen(false); setPreview(null); setContext(""); }}>
              Apply
            </button>
            <button type="button" className="ai-discard-btn" onClick={() => setPreview(null)}>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
