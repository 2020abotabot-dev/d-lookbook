"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAssortment } from "@/lib/assortment-context";
import { usePrint } from "@/lib/print-context";

export default function AssortmentBar() {
  const { selections, toggle, clear, count }       = useAssortment();
  const { triggerPrint, buyerName, setBuyerName }  = usePrint();
  const [expanded, setExpanded] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-collapse when emptied
  useEffect(() => {
    if (count === 0) setExpanded(false);
  }, [count]);

  if (!mounted || count === 0) return null;

  // Show up to 5 thumbnails (newest first)
  const items  = [...selections.values()].reverse();
  const thumbs = items.slice(0, 5);
  const extra  = Math.max(0, count - 5);

  const bar = (
    <div className={`abar${expanded ? " abar--expanded" : ""}`}>
      {!expanded ? (
        /* Collapsed pill */
        <button className="abar__pill" onClick={() => setExpanded(true)}>
          <span className="abar__count">{count}</span>
          <span className="abar__label">Assortment</span>
          <span className="abar__caret">↑</span>
        </button>
      ) : (
        /* Expanded panel */
        <div className="abar__expanded">
          {/* Count */}
          <div className="abar__info">
            <span className="abar__big-count">{count}</span>
            <span className="abar__big-label">selected</span>
          </div>

          {/* Thumbnails */}
          <div className="abar__thumbs">
            {thumbs.map(p => (
              <div key={p.id} className="abar__thumb-wrap">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="abar__thumb" />
                  : <span className="abar__thumb abar__thumb--initials">{p.name[0]}</span>
                }
                <button
                  className="abar__thumb-remove"
                  onClick={() => toggle(p)}
                  aria-label={`Remove ${p.name}`}
                >×</button>
              </div>
            ))}
            {extra > 0 && <span className="abar__thumb-extra">+{extra}</span>}
          </div>

          {/* Actions */}
          <div className="abar__actions">
            <input
              className="abar__buyer-input"
              placeholder="Buyer name (optional)"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
            />
            <button className="abar__btn abar__btn--ghost" onClick={clear}>
              Clear all
            </button>
            <button
              className="abar__btn abar__btn--primary"
              onClick={triggerPrint}
            >
              Export PDF
            </button>
            <button
              className="abar__btn abar__btn--icon"
              onClick={() => setExpanded(false)}
              aria-label="Collapse"
            >↓</button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(bar, document.body);
}
