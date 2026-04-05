"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DbProduct } from "@/types/database";

interface ProductAssignItemProps {
  product: DbProduct;
  featured: boolean;
  onToggleFeatured: () => void;
  onRemove: () => void;
}

export default function ProductAssignItem({
  product, featured, onToggleFeatured, onRemove
}: ProductAssignItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`assign-item${featured ? " assign-item--featured" : ""}`}>
      <button type="button" className="assign-item__handle" {...attributes} {...listeners} aria-label="Drag">
        &#8597;
      </button>

      <div className="assign-item__info">
        <p className="assign-item__name">{product.name}</p>
        <p className="assign-item__sku">{product.sku}</p>
      </div>

      <button
        type="button"
        className={`assign-item__feature${featured ? " assign-item__feature--on" : ""}`}
        onClick={onToggleFeatured}
        title={featured ? "Remove featured" : "Mark as featured"}
      >
        &#9733;
      </button>

      <button type="button" className="assign-item__remove" onClick={onRemove} aria-label="Remove">
        &#10005;
      </button>
    </div>
  );
}
