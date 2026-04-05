"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT } from "@/lib/mock/data";
import { createLookbook } from "@/app/actions/lookbooks";
import TemplateCard from "@/components/admin/lookbook/TemplateCard";

const TEMPLATES = [
  {
    id:       "collection",
    name:     "Collection",
    desc:     "Classic product grid with category filtering. Great for full season overviews.",
    badge:    null,
  },
  {
    id:       "lifestyle",
    name:     "Lifestyle",
    desc:     "Hero-heavy with editorial blocks between product sections.",
    badge:    null,
  },
  {
    id:       "minimal",
    name:     "Minimal",
    desc:     "Clean single-column scroll. Ideal for focused capsule collections.",
    badge:    null,
  },
  {
    id:       "cinematic",
    name:     "Cinematic",
    desc:     "Immersive scroll-driven experience — video hero, side-scroll panels, sticky chapters. Inspired by MRL-SS27.",
    badge:    "✦ AI-powered",
  },
];

export default function NewLookbookPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("collection");
  const [title, setTitle]           = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tenant = MOCK_TENANT; // TODO: real tenant from session

  function handleCreate() {
    if (!title.trim()) { setError("Please enter a title."); return; }
    startTransition(async () => {
      setError(null);
      const result = await createLookbook(tenant.id, selectedId, title);
      if (result.error) { setError(result.error); return; }
      router.push(`/builder/${result.id}/edit`);
    });
  }

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <h1 className="platform-page__title">New Lookbook</h1>
          <p className="platform-page__sub">Choose a template to get started</p>
        </div>
      </div>

      <div className="new-lookbook">
        <div className="template-grid">
          {TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.badge ? `${t.badge} — ${t.desc}` : t.desc}
              selected={selectedId === t.id}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <div className="new-lookbook__meta">
          <label className="settings-label">
            Lookbook title
            <input
              className="settings-input"
              placeholder="e.g. SS27 Collection"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(null); }}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creating…" : "Create lookbook"}
          </button>
        </div>
      </div>
    </div>
  );
}
