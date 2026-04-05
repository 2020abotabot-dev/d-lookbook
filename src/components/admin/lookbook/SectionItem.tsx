"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionType } from "@/types/lookbook";
import SectionConfigModal from "./SectionConfigModal";

const TYPE_LABELS: Record<SectionType, string> = {
  hero:                "Hero",
  product_grid:        "Product Grid",
  editorial:           "Editorial",
  campaign:            "Campaign",
  banner:              "Banner",
  video_hero:          "✦ Video Hero",
  horizontal_scroll:   "✦ Side Scroll",
  sticky_chapters:     "✦ Sticky Chapters",
  parallax_editorial:  "✦ Parallax Editorial",
};

interface SectionItemProps {
  id: string;
  title: string;
  type: SectionType;
  config: Record<string, unknown>;
  onConfigSave: (id: string, config: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export default function SectionItem({
  id, title, type, config, onConfigSave, onDelete
}: SectionItemProps) {
  const [showConfig, setShowConfig] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="section-item">
        <button
          type="button"
          className="section-item__handle"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          &#8597;
        </button>

        <div className="section-item__info">
          <span className="section-item__type-badge">{TYPE_LABELS[type]}</span>
          <span className="section-item__title">{title}</span>
        </div>

        <div className="section-item__actions">
          <button type="button" className="table-action" onClick={() => setShowConfig(true)}>
            Configure
          </button>
          <button type="button" className="table-action table-action--danger" onClick={() => onDelete(id)}>
            Delete
          </button>
        </div>
      </div>

      {showConfig && (
        <SectionConfigModal
          type={type}
          title={title}
          config={config}
          onSave={cfg => onConfigSave(id, cfg)}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
}
