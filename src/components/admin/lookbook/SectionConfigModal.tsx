"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { SectionType } from "@/types/lookbook";

interface SectionConfig extends Record<string, unknown> {
  headline?: string;
  subline?: string;
  overlay_opacity?: number;
  layout?: string;
  filter_enabled?: boolean;
  body?: string;
  image_position?: string;
  bg_color?: string;
  cta_link?: string;
}

interface SectionConfigModalProps {
  type: SectionType;
  title: string;
  config: SectionConfig;
  onSave: (config: SectionConfig) => void;
  onClose: () => void;
}

export default function SectionConfigModal({
  type, title, config: initial, onSave, onClose
}: SectionConfigModalProps) {
  const [cfg, setCfg] = useState<SectionConfig>(initial);

  function update(patch: Partial<SectionConfig>) {
    setCfg(prev => ({ ...prev, ...patch }));
  }

  return (
    <Modal open={true} title={`Configure: ${title}`} onClose={onClose}>
      <div className="settings-form">
        {type === "hero" && (
          <>
            <label className="settings-label">
              Headline
              <input className="settings-input" value={cfg.headline ?? ""} onChange={e => update({ headline: e.target.value })} />
            </label>
            <label className="settings-label">
              Subline
              <input className="settings-input" value={cfg.subline ?? ""} onChange={e => update({ subline: e.target.value })} />
            </label>
            <label className="settings-label">
              Overlay opacity
              <input
                type="range" min="0" max="1" step="0.05"
                value={cfg.overlay_opacity ?? 0.4}
                onChange={e => update({ overlay_opacity: parseFloat(e.target.value) })}
              />
              <span>{((cfg.overlay_opacity ?? 0.4) * 100).toFixed(0)}%</span>
            </label>
          </>
        )}

        {type === "product_grid" && (
          <>
            <label className="settings-label">
              Layout
              <select className="settings-input" value={cfg.layout ?? "3-col"} onChange={e => update({ layout: e.target.value })}>
                <option value="3-col">3 columns</option>
                <option value="4-col">4 columns</option>
                <option value="masonry">Masonry</option>
              </select>
            </label>
            <label className="settings-label settings-label--row">
              <input type="checkbox" checked={!!cfg.filter_enabled} onChange={e => update({ filter_enabled: e.target.checked })} />
              Enable filter bar
            </label>
          </>
        )}

        {type === "editorial" && (
          <>
            <label className="settings-label">
              Body text
              <textarea className="settings-input settings-textarea" rows={4} value={cfg.body ?? ""} onChange={e => update({ body: e.target.value })} />
            </label>
            <label className="settings-label">
              Image position
              <select className="settings-input" value={cfg.image_position ?? "right"} onChange={e => update({ image_position: e.target.value })}>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="full">Full width</option>
              </select>
            </label>
          </>
        )}

        {type === "campaign" && (
          <>
            <label className="settings-label">
              Headline
              <input className="settings-input" value={cfg.headline ?? ""} onChange={e => update({ headline: e.target.value })} />
            </label>
          </>
        )}

        {type === "banner" && (
          <>
            <label className="settings-label">
              Text
              <input className="settings-input" value={cfg.headline ?? ""} onChange={e => update({ headline: e.target.value })} />
            </label>
            <label className="settings-label">
              Background color
              <input type="color" className="color-picker__swatch" value={cfg.bg_color ?? "#111111"} onChange={e => update({ bg_color: e.target.value })} />
            </label>
            <label className="settings-label">
              CTA link
              <input className="settings-input" placeholder="https://…" value={cfg.cta_link ?? ""} onChange={e => update({ cta_link: e.target.value })} />
            </label>
          </>
        )}
      </div>

      <div className="modal__footer">
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={() => { onSave(cfg); onClose(); }}>Save</button>
      </div>
    </Modal>
  );
}
