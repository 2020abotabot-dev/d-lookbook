"use client";

import { useState } from "react";
import type { GeneratedGrouping } from "@/lib/ai/schemas";

interface ProductSummary {
  id:       string;
  name:     string;
  category: string;
  tags?:    string[];
  price?:   number;
}

interface Props {
  tenantId: string;
  products: ProductSummary[];
  onApply:  (grouping: GeneratedGrouping) => void;
}

export default function GroupingAdvisor({ tenantId, products, onApply }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [result,  setResult]  = useState<GeneratedGrouping | null>(null);

  async function suggest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/suggest-grouping", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId, products }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data as GeneratedGrouping);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ai-write-btn" onClick={() => setOpen(true)}>
        <span className="ai-icon">✦</span>
        Smart Group ({products.length} products)
      </button>
    );
  }

  return (
    <div className="ai-grouping-panel">
      <div className="ai-editorial-header">
        <span className="ai-icon">✦</span>
        <strong>AI Product Grouping</strong>
        <button type="button" className="ai-close" onClick={() => setOpen(false)}>✕</button>
      </div>

      <p className="ai-grouping-desc">
        Claude will analyse {products.length} products and suggest logical lookbook sections
        based on activity type, category, and product story.
      </p>

      {!result && (
        <button
          type="button"
          className="ai-generate-btn"
          onClick={suggest}
          disabled={loading}
        >
          {loading ? <span className="ai-spinner" /> : "Suggest Groupings"}
        </button>
      )}

      {error && <p className="ai-error">{error}</p>}

      {result && (
        <div className="ai-grouping-results">
          {result.groups.map((g, i) => (
            <div key={i} className="ai-group-card">
              <div className="ai-group-header">
                <span className="ai-group-type">{g.section_type}</span>
                <strong>{g.title}</strong>
              </div>
              <p className="ai-group-rationale">{g.rationale}</p>
              <p className="ai-group-count">{g.product_ids.length} products</p>
            </div>
          ))}
          <div className="ai-preview-actions">
            <button type="button" className="ai-apply-btn" onClick={() => { onApply(result); setOpen(false); }}>
              Apply Groupings
            </button>
            <button type="button" className="ai-discard-btn" onClick={suggest}>
              {loading ? <span className="ai-spinner" /> : "Retry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
