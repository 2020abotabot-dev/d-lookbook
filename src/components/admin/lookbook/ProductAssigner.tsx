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
import { assignProduct, removeProduct, reorderProducts } from "@/app/actions/lookbooks";
import type { DbProduct } from "@/types/database";
import type { DbLookbookProduct, DbLookbookSection } from "@/types/database";
import ProductAssignItem from "./ProductAssignItem";

interface AssignedProduct {
  productId: string;
  position: number;
  featured: boolean;
}

interface ProductAssignerProps {
  lookbookId: string;
  tenantId: string;
  allProducts: DbProduct[];
  sections: DbLookbookSection[];
  initialAssignments: DbLookbookProduct[];
  onAssignmentsChange?: (assignments: DbLookbookProduct[]) => void;
}

export default function ProductAssigner({
  lookbookId, tenantId, allProducts, sections, initialAssignments, onAssignmentsChange
}: ProductAssignerProps) {
  const gridSections = sections.filter(s => s.type === "product_grid");

  const [activeSectionId, setActiveSectionId] = useState(gridSections[0]?.id ?? "");
  const [assignments, setAssignments]         = useState<Record<string, AssignedProduct[]>>(
    () => {
      const map: Record<string, AssignedProduct[]> = {};
      gridSections.forEach(s => {
        map[s.id] = initialAssignments
          .filter(a => a.section === s.id)
          .sort((a, b) => a.position - b.position)
          .map(a => ({ productId: a.product_id, position: a.position, featured: a.featured }));
      });
      return map;
    }
  );

  function notifyParent(next: Record<string, AssignedProduct[]>) {
    if (!onAssignmentsChange) return;
    const flat: DbLookbookProduct[] = Object.entries(next).flatMap(([sectionId, items]) =>
      items.map(a => ({
        id:          `${lookbookId}-${sectionId}-${a.productId}`,
        lookbook_id: lookbookId,
        product_id:  a.productId,
        tenant_id:   tenantId,
        section:     sectionId,
        position:    a.position,
        featured:    a.featured,
      }))
    );
    onAssignmentsChange(flat);
  }

  const [search, setSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  const sectionAssigned = assignments[activeSectionId] ?? [];
  const assignedIds     = new Set(sectionAssigned.map(a => a.productId));

  const availableProducts = allProducts.filter(p =>
    !assignedIds.has(p.id) &&
    (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleAssign(product: DbProduct) {
    const position = sectionAssigned.length;
    const newEntry: AssignedProduct = { productId: product.id, position, featured: false };
    const next = { ...assignments, [activeSectionId]: [...(assignments[activeSectionId] ?? []), newEntry] };
    setAssignments(next);
    notifyParent(next);
    await assignProduct(lookbookId, product.id, tenantId, activeSectionId, position);
  }

  async function handleRemove(productId: string) {
    const next = {
      ...assignments,
      [activeSectionId]: (assignments[activeSectionId] ?? []).filter(a => a.productId !== productId),
    };
    setAssignments(next);
    notifyParent(next);
    await removeProduct(lookbookId, productId);
  }

  async function handleToggleFeatured(productId: string) {
    const next = {
      ...assignments,
      [activeSectionId]: (assignments[activeSectionId] ?? []).map(a =>
        a.productId === productId ? { ...a, featured: !a.featured } : a
      ),
    };
    setAssignments(next);
    notifyParent(next);
    const current = sectionAssigned.find(a => a.productId === productId);
    if (current) {
      await assignProduct(lookbookId, productId, tenantId, activeSectionId, current.position, !current.featured);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const list = sectionAssigned;
    const oldIdx = list.findIndex(a => a.productId === active.id);
    const newIdx = list.findIndex(a => a.productId === over.id);
    const reordered = arrayMove(list, oldIdx, newIdx).map((a, i) => ({ ...a, position: i }));
    const next = { ...assignments, [activeSectionId]: reordered };
    setAssignments(next);
    notifyParent(next);
    reorderProducts(lookbookId, activeSectionId, reordered.map(a => a.productId));
  }

  return (
    <div className="product-assigner">
      {/* Section tabs */}
      {gridSections.length > 1 && (
        <div className="product-assigner__section-tabs">
          {gridSections.map(s => (
            <button
              key={s.id}
              type="button"
              className={`product-assigner__section-tab${s.id === activeSectionId ? " product-assigner__section-tab--active" : ""}`}
              onClick={() => setActiveSectionId(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div className="product-assigner__panes">
        {/* Left: library */}
        <div className="product-assigner__library">
          <p className="product-assigner__pane-title">Product library</p>
          <input
            className="settings-input product-assigner__search"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="product-assigner__list">
            {availableProducts.map(p => (
              <div key={p.id} className="library-item">
                <div className="library-item__info">
                  <p className="library-item__name">{p.name}</p>
                  <p className="library-item__sku">{p.sku}</p>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost library-item__add"
                  onClick={() => handleAssign(p)}
                >
                  Add
                </button>
              </div>
            ))}
            {availableProducts.length === 0 && (
              <p className="product-assigner__empty">All products assigned to this section.</p>
            )}
          </div>
        </div>

        {/* Right: assigned */}
        <div className="product-assigner__assigned">
          <p className="product-assigner__pane-title">
            {sections.find(s => s.id === activeSectionId)?.title ?? "Section"} ({sectionAssigned.length})
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sectionAssigned.map(a => a.productId)}
              strategy={verticalListSortingStrategy}
            >
              {sectionAssigned.length === 0 && (
                <div className="product-assigner__empty">
                  Add products from the library to this section.
                </div>
              )}
              {sectionAssigned.map(a => {
                const product = allProducts.find(p => p.id === a.productId);
                if (!product) return null;
                return (
                  <ProductAssignItem
                    key={a.productId}
                    product={product}
                    featured={a.featured}
                    onToggleFeatured={() => handleToggleFeatured(a.productId)}
                    onRemove={() => handleRemove(a.productId)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
