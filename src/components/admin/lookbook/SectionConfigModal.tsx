"use client";

import { useRef, useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { uploadSectionMedia } from "@/app/actions/lookbooks";
import type { SectionType } from "@/types/lookbook";

interface SectionConfig extends Record<string, unknown> {
  headline?: string;
  subline?: string;
  overlay_opacity?: number;
  media_url?: string;
  media_type?: "image" | "video";
  layout?: string;
  filter_enabled?: boolean;
  body?: string;
  image_position?: string;
  bg_color?: string;
  cta_link?: string;
  // parallax editorial
  image_left_url?: string;
  image_right_url?: string;
  // video hero
  words?: string[];
  // horizontal scroll
  panels?: Panel[];
  snap?: boolean;
  // sticky chapters
  chapters?: Chapter[];
}

interface Panel {
  id: string;
  title: string;
  body?: string;
  image_url?: string;
  accent_color?: string;
  label?: string;
}

interface Chapter {
  eyebrow?: string;
  headline: string;
  body?: string;
  panel_color?: string;
}

interface SectionConfigModalProps {
  type:      SectionType;
  title:     string;
  config:    SectionConfig;
  tenantId:  string;
  sectionId: string;
  onSave:    (config: SectionConfig) => void;
  onClose:   () => void;
}

// ── Inline image upload picker ────────────────────────────────────────────────
function ImagePicker({
  label,
  value,
  tenantId,
  sectionId,
  field,
  onUpload,
}: {
  label:     string;
  value:     string | undefined;
  tenantId:  string;
  sectionId: string;
  field:     string;
  onUpload:  (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleFile(file: File) {
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    startUpload(async () => {
      const result = await uploadSectionMedia(fd, tenantId, sectionId, field);
      if (result.error) { setErr(result.error); return; }
      if (result.url) onUpload(result.url);
    });
  }

  // useTransition doesn't expose startTransition inline; use useState
  const [isPending, setIsPending] = useState(false);
  function startUpload(fn: () => Promise<void>) {
    setIsPending(true);
    fn().finally(() => setIsPending(false));
  }

  return (
    <div className="section-img-picker">
      <p className="settings-label">{label}</p>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="section-img-picker__preview" />
      )}
      <div className="section-img-picker__row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button type="button" className="btn btn--ghost" onClick={() => onUpload("")}>
            Remove
          </button>
        )}
      </div>
      {err && <p className="form-error">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function SectionConfigModal({
  type, title, config: initial, tenantId, sectionId, onSave, onClose
}: SectionConfigModalProps) {
  const [cfg, setCfg] = useState<SectionConfig>(initial);

  function update(patch: Partial<SectionConfig>) {
    setCfg(prev => ({ ...prev, ...patch }));
  }

  // ── Panel helpers (horizontal scroll) ──────────────────────────────────────
  const panels: Panel[] = (cfg.panels as Panel[] | undefined) ?? [];

  function updatePanel(idx: number, patch: Partial<Panel>) {
    const next = panels.map((p, i) => i === idx ? { ...p, ...patch } : p);
    update({ panels: next });
  }

  function addPanel() {
    update({ panels: [...panels, { id: crypto.randomUUID(), title: `Panel ${panels.length + 1}` }] });
  }

  function removePanel(idx: number) {
    update({ panels: panels.filter((_, i) => i !== idx) });
  }

  // ── Chapter helpers (sticky chapters) ──────────────────────────────────────
  const chapters: Chapter[] = (cfg.chapters as Chapter[] | undefined) ?? [];

  function updateChapter(idx: number, patch: Partial<Chapter>) {
    const next = chapters.map((c, i) => i === idx ? { ...c, ...patch } : c);
    update({ chapters: next });
  }

  function addChapter() {
    update({ chapters: [...chapters, { headline: `Chapter ${chapters.length + 1}` }] });
  }

  function removeChapter(idx: number) {
    update({ chapters: chapters.filter((_, i) => i !== idx) });
  }

  return (
    <Modal open={true} title={`Configure: ${title}`} onClose={onClose}>
      <div className="settings-form">

        {/* ── Hero ── */}
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
              <input type="range" min="0" max="1" step="0.05" value={cfg.overlay_opacity ?? 0.4}
                onChange={e => update({ overlay_opacity: parseFloat(e.target.value) })} />
              <span>{((cfg.overlay_opacity ?? 0.4) * 100).toFixed(0)}%</span>
            </label>
            <ImagePicker
              label="Background image / video"
              value={cfg.media_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="hero-bg"
              onUpload={url => update({ media_url: url, media_type: url.match(/\.(mp4|webm)$/) ? "video" : "image" })}
            />
          </>
        )}

        {/* ── Product Grid ── */}
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

        {/* ── Editorial ── */}
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
            <ImagePicker
              label="Image"
              value={cfg.media_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="editorial-img"
              onUpload={url => update({ media_url: url })}
            />
            <label className="settings-label">
              Background color (optional)
              <input type="color" className="color-picker__swatch" value={cfg.bg_color ?? "#ffffff"} onChange={e => update({ bg_color: e.target.value })} />
            </label>
          </>
        )}

        {/* ── Campaign ── */}
        {type === "campaign" && (
          <>
            <label className="settings-label">
              Headline
              <input className="settings-input" value={cfg.headline ?? ""} onChange={e => update({ headline: e.target.value })} />
            </label>
            <label className="settings-label">
              Overlay opacity
              <input type="range" min="0" max="1" step="0.05" value={cfg.overlay_opacity ?? 0.35}
                onChange={e => update({ overlay_opacity: parseFloat(e.target.value) })} />
              <span>{((cfg.overlay_opacity ?? 0.35) * 100).toFixed(0)}%</span>
            </label>
            <ImagePicker
              label="Background image"
              value={cfg.media_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="campaign-bg"
              onUpload={url => update({ media_url: url })}
            />
          </>
        )}

        {/* ── Banner ── */}
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

        {/* ── ✦ Video Hero ── */}
        {type === "video_hero" && (
          <>
            <label className="settings-label">
              Words (one per line, 3–5 words shown in sequence on scroll)
              <textarea
                className="settings-input settings-textarea"
                rows={5}
                value={(cfg.words as string[] | undefined)?.join("\n") ?? ""}
                onChange={e => update({ words: e.target.value.split("\n").map(w => w.trim()).filter(Boolean) })}
              />
            </label>
            <label className="settings-label">
              Subline (optional)
              <input className="settings-input" value={cfg.subline ?? ""} onChange={e => update({ subline: e.target.value })} />
            </label>
            <ImagePicker
              label="Background video or image"
              value={cfg.media_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="video-hero-bg"
              onUpload={url => update({ media_url: url, media_type: url.match(/\.(mp4|webm)$/) ? "video" : "image" })}
            />
          </>
        )}

        {/* ── ✦ Horizontal Scroll ── */}
        {type === "horizontal_scroll" && (
          <>
            <p className="settings-label" style={{ marginBottom: ".25rem" }}>Panels ({panels.length})</p>
            {panels.map((panel, i) => (
              <div key={panel.id} className="sc-panel-editor">
                <div className="sc-panel-editor__header">
                  <span className="sc-panel-editor__num">Panel {i + 1}</span>
                  <button type="button" className="table-action table-action--danger" onClick={() => removePanel(i)}>Remove</button>
                </div>
                <label className="settings-label">
                  Title
                  <input className="settings-input" value={panel.title} onChange={e => updatePanel(i, { title: e.target.value })} />
                </label>
                <label className="settings-label">
                  Label (small tag above title)
                  <input className="settings-input" value={panel.label ?? ""} onChange={e => updatePanel(i, { label: e.target.value })} />
                </label>
                <label className="settings-label">
                  Body text
                  <textarea className="settings-input settings-textarea" rows={2} value={panel.body ?? ""} onChange={e => updatePanel(i, { body: e.target.value })} />
                </label>
                <ImagePicker
                  label="Panel background image"
                  value={panel.image_url}
                  tenantId={tenantId}
                  sectionId={sectionId}
                  field={`hs-panel-${i}`}
                  onUpload={url => updatePanel(i, { image_url: url })}
                />
                <label className="settings-label">
                  Accent color
                  <input type="color" className="color-picker__swatch" value={panel.accent_color ?? "#ffffff"} onChange={e => updatePanel(i, { accent_color: e.target.value })} />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn--ghost" onClick={addPanel} style={{ marginTop: ".5rem" }}>
              + Add panel
            </button>
            <label className="settings-label settings-label--row" style={{ marginTop: ".75rem" }}>
              <input type="checkbox" checked={cfg.snap !== false} onChange={e => update({ snap: e.target.checked })} />
              Snap to panels
            </label>
          </>
        )}

        {/* ── ✦ Sticky Chapters ── */}
        {type === "sticky_chapters" && (
          <>
            <p className="settings-label" style={{ marginBottom: ".25rem" }}>Chapters ({chapters.length})</p>
            {chapters.map((chapter, i) => (
              <div key={i} className="sc-panel-editor">
                <div className="sc-panel-editor__header">
                  <span className="sc-panel-editor__num">Chapter {i + 1}</span>
                  <button type="button" className="table-action table-action--danger" onClick={() => removeChapter(i)}>Remove</button>
                </div>
                <label className="settings-label">
                  Eyebrow (small text above headline)
                  <input className="settings-input" value={chapter.eyebrow ?? ""} onChange={e => updateChapter(i, { eyebrow: e.target.value })} />
                </label>
                <label className="settings-label">
                  Headline
                  <input className="settings-input" value={chapter.headline} onChange={e => updateChapter(i, { headline: e.target.value })} />
                </label>
                <label className="settings-label">
                  Body
                  <textarea className="settings-input settings-textarea" rows={3} value={chapter.body ?? ""} onChange={e => updateChapter(i, { body: e.target.value })} />
                </label>
                <label className="settings-label">
                  Panel background color
                  <input type="color" className="color-picker__swatch" value={chapter.panel_color ?? "#111111"} onChange={e => updateChapter(i, { panel_color: e.target.value })} />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn--ghost" onClick={addChapter} style={{ marginTop: ".5rem" }}>
              + Add chapter
            </button>
          </>
        )}

        {/* ── ✦ Parallax Editorial ── */}
        {type === "parallax_editorial" && (
          <>
            <label className="settings-label">
              Headline
              <input className="settings-input" value={cfg.headline ?? ""} onChange={e => update({ headline: e.target.value })} />
            </label>
            <label className="settings-label">
              Body (optional)
              <textarea className="settings-input settings-textarea" rows={3} value={cfg.body ?? ""} onChange={e => update({ body: e.target.value })} />
            </label>
            <ImagePicker
              label="Left image"
              value={cfg.image_left_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="pe-left"
              onUpload={url => update({ image_left_url: url })}
            />
            <ImagePicker
              label="Right image"
              value={cfg.image_right_url}
              tenantId={tenantId}
              sectionId={sectionId}
              field="pe-right"
              onUpload={url => update({ image_right_url: url })}
            />
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
