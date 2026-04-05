"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { GeneratedLayout } from "@/lib/ai/schemas";

interface Props {
  id:       string;
  tenantId: string;
}

export default function AIAssistClient({ id, tenantId }: Props) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [result,      setResult]      = useState<GeneratedLayout | null>(null);
  const [applying,    setApplying]    = useState(false);

  async function generate() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-layout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data as GeneratedLayout);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function applyLayout() {
    if (!result) return;
    setApplying(true);
    try {
      const { upsertSection } = await import("@/app/actions/lookbooks");
      await Promise.all(
        result.sections.map(sec =>
          upsertSection({
            id:          sec.id,
            lookbook_id: id,
            tenant_id:   tenantId,
            title:       sec.title,
            description: sec.description,
            type:        sec.type,
            config:      sec.config,
            sort_order:  sec.sort_order,
          })
        )
      );
      router.push(`/builder/${id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply layout");
      setApplying(false);
    }
  }

  const sectionTypeIcons: Record<string, string> = {
    hero:         "◼",
    product_grid: "⊞",
    editorial:    "✍",
    campaign:     "◻",
    banner:       "▬",
  };

  return (
    <div className="ai-assist-page">
      <Breadcrumb
        items={[
          { label: "Builder", href: "/builder" },
          { label: "Edit",    href: `/builder/${id}/edit` },
          { label: "AI Assist" },
        ]}
      />

      <div className="ai-assist-header">
        <div className="ai-assist-badge">
          <span className="ai-icon">✦</span>
          AI Co-Pilot
        </div>
        <h1 className="ai-assist-title">Auto-Layout Generator</h1>
        <p className="ai-assist-desc">
          Describe your lookbook in plain language. Claude will generate a complete
          section layout — hero, product grids, editorial blocks — ready to populate.
        </p>
      </div>

      <div className="ai-assist-form">
        <label className="ai-label" htmlFor="layout-desc">
          Describe your lookbook
        </label>
        <textarea
          id="layout-desc"
          className="ai-textarea"
          placeholder="e.g. 'Spring trail running campaign — energetic, technical. Start with a dramatic mountain hero image, then two product grids separated by an editorial story about the freedom of moving in nature. End with a newsletter CTA banner.'"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
        />

        <div className="ai-examples">
          <p className="ai-examples-label">Try an example:</p>
          <div className="ai-example-pills">
            {[
              "Minimal SS27 collection — clean white backgrounds, 4 product grids by category, no hero image",
              "Lifestyle hiking campaign — big landscape hero, editorial story, two product grids, CTA banner",
              "High-energy trail running edit — cinematic hero, key styles featured, women's and men's grids",
            ].map(ex => (
              <button
                key={ex}
                type="button"
                className="ai-example-pill"
                onClick={() => setDescription(ex)}
              >
                {ex.slice(0, 55)}…
              </button>
            ))}
          </div>
        </div>

        {error && <p className="ai-error">{error}</p>}

        <button
          type="button"
          className="ai-generate-btn ai-generate-btn--full"
          onClick={generate}
          disabled={loading || !description.trim()}
        >
          {loading ? (
            <><span className="ai-spinner" /> Generating layout…</>
          ) : (
            <><span className="ai-icon">✦</span> Generate Layout</>
          )}
        </button>
      </div>

      {result && (
        <div className="ai-result">
          <div className="ai-result-header">
            <h2 className="ai-result-title">{result.title}</h2>
            <span className="ai-result-count">{result.sections.length} sections</span>
          </div>

          <div className="ai-section-preview-list">
            {result.sections.map((sec, i) => (
              <div key={sec.id} className="ai-section-preview-item">
                <span className="ai-section-order">{i + 1}</span>
                <span className="ai-section-type-icon">{sectionTypeIcons[sec.type] ?? "·"}</span>
                <div className="ai-section-preview-info">
                  <strong>{sec.title}</strong>
                  <span className="ai-section-type-label">{sec.type.replace("_", " ")}</span>
                </div>
                {sec.description && (
                  <p className="ai-section-preview-desc">{sec.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="ai-result-actions">
            <button
              type="button"
              className="ai-apply-btn ai-apply-btn--lg"
              onClick={applyLayout}
              disabled={applying}
            >
              {applying ? "Applying…" : "Apply This Layout"}
            </button>
            <button
              type="button"
              className="ai-discard-btn"
              onClick={() => setResult(null)}
            >
              Generate Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
