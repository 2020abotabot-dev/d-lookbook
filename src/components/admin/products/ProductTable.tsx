"use client";

import { useState } from "react";
import Link from "next/link";
import type { DbProduct } from "@/types/database";
import { archiveProduct } from "@/app/actions/products";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT } from "@/lib/mock/data";

const STATUS_CLASS: Record<string, string> = {
  active:   "status-badge--active",
  draft:    "status-badge--draft",
  archived: "status-badge--archived",
};

interface ProductTableProps {
  products: DbProduct[];
  tenantId: string;
  categories: string[];
}

export default function ProductTable({ products, tenantId, categories }: ProductTableProps) {
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<string | null>(null);
  const [statusFilter, setStatus]   = useState<string | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [rows, setRows]             = useState(products);

  const visible = rows.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map(p => p.id)));
    }
  }

  async function handleArchiveSelected() {
    for (const id of selected) {
      await archiveProduct(id, tenantId);
    }
    if (TEST_MODE) {
      setRows(prev => prev.map(p => selected.has(p.id) ? { ...p, status: "archived" as const } : p));
    }
    setSelected(new Set());
  }

  async function handleArchive(id: string) {
    await archiveProduct(id, tenantId);
    if (TEST_MODE) {
      setRows(prev => prev.map(p => p.id === id ? { ...p, status: "archived" as const } : p));
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div className="product-table-bar">
        <input
          className="settings-input product-table-bar__search"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-pills">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              className={`fbar__pill${catFilter === c ? " fbar__pill--on" : ""}`}
              onClick={() => setCatFilter(catFilter === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filter-pills">
          {["active","draft","archived"].map(s => (
            <button
              key={s}
              type="button"
              className={`fbar__pill${statusFilter === s ? " fbar__pill--on" : ""}`}
              onClick={() => setStatus(statusFilter === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="product-table-bar__actions">
          <Link href="/products/new" className="btn btn--primary">Add product</Link>
          <Link href="/products/import" className="btn btn--ghost">Import</Link>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar__count">{selected.size} selected</span>
          <button type="button" className="btn btn--ghost bulk-bar__action" onClick={handleArchiveSelected}>
            Archive selected
          </button>
          <button type="button" className="bulk-bar__clear" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="product-table">
        <div className="product-table__head">
          <span>
            <input
              type="checkbox"
              checked={selected.size === visible.length && visible.length > 0}
              onChange={toggleAll}
            />
          </span>
          <span>Name</span>
          <span>SKU</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {visible.length === 0 && (
          <div className="empty-state">
            <p className="empty-state__text">No products match your filters.</p>
          </div>
        )}

        {visible.map(product => (
          <div key={product.id} className="product-table__row">
            <span>
              <input
                type="checkbox"
                checked={selected.has(product.id)}
                onChange={() => toggleSelect(product.id)}
              />
            </span>
            <span className="product-table__name">{product.name}</span>
            <span className="product-table__sku">{product.sku}</span>
            <span>{product.category}</span>
            <span>{product.currency} {product.price.toFixed(2)}</span>
            <span>
              <span className={`status-badge ${STATUS_CLASS[product.status] ?? ""}`}>
                {product.status}
              </span>
            </span>
            <span className="product-table__row-actions">
              <Link href={`/products/${product.id}/edit`} className="table-action">Edit</Link>
              {product.status !== "archived" && (
                <button type="button" className="table-action table-action--danger" onClick={() => handleArchive(product.id)}>
                  Archive
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
