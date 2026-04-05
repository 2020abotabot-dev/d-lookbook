"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { upsertSection, deleteSection, reorderSections } from "@/app/actions/lookbooks";
import type { SectionType } from "@/types/lookbook";
import type { DbLookbookSection } from "@/types/database";
import SectionItem from "./SectionItem";

const ADD_OPTIONS: { type: SectionType; label: string; group?: string }[] = [
  // Standard
  { type: "hero",                label: "Hero" },
  { type: "product_grid",        label: "Product Grid" },
  { type: "editorial",           label: "Editorial" },
  { type: "campaign",            label: "Campaign" },
  { type: "banner",              label: "Banner" },
  // Cinematic
  { type: "video_hero",          label: "✦ Video Hero (Cinematic)",          group: "cinematic" },
  { type: "horizontal_scroll",   label: "✦ Side Scroll Panels (Cinematic)",  group: "cinematic" },
  { type: "sticky_chapters",     label: "✦ Sticky Chapters (Cinematic)",     group: "cinematic" },
  { type: "parallax_editorial",  label: "✦ Parallax Editorial (Cinematic)",  group: "cinematic" },
];

interface SectionListProps {
  lookbookId: string;
  tenantId: string;
  initial: DbLookbookSection[];
}

export default function SectionList({ lookbookId, tenantId, initial }: SectionListProps) {
  const [sections, setSections] = useState(initial);
  const [showAdd, setShowAdd]   = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    const next   = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i }));
    setSections(next);
    reorderSections(lookbookId, next.map(s => s.id));
  }

  async function handleAdd(type: SectionType) {
    setShowAdd(false);
    const newSection: DbLookbookSection = {
      id:          `sec-${Date.now()}`,
      lookbook_id: lookbookId,
      tenant_id:   tenantId,
      title:       `New ${type.replace("_", " ")}`,
      description: null,
      type,
      config:      {},
      sort_order:  sections.length,
      created_at:  new Date().toISOString(),
    };
    setSections(prev => [...prev, newSection]);
    await upsertSection({ ...newSection });
  }

  async function handleConfigSave(id: string, config: Record<string, unknown>) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, config } : s));
    const section = sections.find(s => s.id === id);
    if (section) await upsertSection({ ...section, config });
  }

  async function handleDelete(id: string) {
    setSections(prev => prev.filter(s => s.id !== id));
    await deleteSection(id);
  }

  return (
    <div className="section-list">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__text">No sections yet. Add one below.</p>
            </div>
          )}
          {sections.map(s => (
            <SectionItem
              key={s.id}
              id={s.id}
              title={s.title}
              type={s.type}
              config={s.config}
              onConfigSave={handleConfigSave}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="section-list__add">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setShowAdd(v => !v)}
        >
          + Add section
        </button>

        {showAdd && (
          <div className="section-add-menu">
            {ADD_OPTIONS.map(opt => (
              <button
                key={opt.type}
                type="button"
                className="section-add-menu__item"
                onClick={() => handleAdd(opt.type)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
