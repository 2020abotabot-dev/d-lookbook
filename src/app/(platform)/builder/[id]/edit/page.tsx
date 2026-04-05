"use client";

import { useState, useTransition } from "react";
import { notFound } from "next/navigation";
import { use } from "react";
import { TEST_MODE } from "@/lib/test-mode";
import {
  MOCK_LOOKBOOKS,
  MOCK_SECTIONS,
  MOCK_LOOKBOOK_PRODUCTS,
  MOCK_PRODUCTS,
  MOCK_TENANT,
} from "@/lib/mock/data";
import { publishLookbook } from "@/app/actions/lookbooks";
import Breadcrumb from "@/components/ui/Breadcrumb";
import SectionList from "@/components/admin/lookbook/SectionList";
import ProductAssigner from "@/components/admin/lookbook/ProductAssigner";
import BuilderPreview from "@/components/admin/lookbook/BuilderPreview";
import GroupingAdvisor from "@/components/admin/ai/GroupingAdvisor";

const STEPS = ["Template", "Sections", "Products", "Preview & Publish"] as const;
type Step = typeof STEPS[number];

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditLookbookPage({ params }: Props) {
  const { id } = use(params);

  // TODO: fetch from Supabase when !TEST_MODE
  let lookbook = MOCK_LOOKBOOKS.find(l => l.id === id);
  // In TEST_MODE newly-created lookbooks won't be in MOCK_LOOKBOOKS — use lb-001 as fallback
  if (!lookbook && TEST_MODE) {
    lookbook = { ...MOCK_LOOKBOOKS[0], id };
  }
  if (!lookbook) return notFound();

  const baseId      = MOCK_LOOKBOOKS.find(l => l.id === id) ? id : MOCK_LOOKBOOKS[0].id;
  const sections    = MOCK_SECTIONS.filter(s => s.lookbook_id === baseId);
  const assignments = MOCK_LOOKBOOK_PRODUCTS.filter(lp => lp.lookbook_id === baseId);
  const tenant      = MOCK_TENANT;

  return (
    <EditLookbookClient
      lookbookId={id}
      lookbook={lookbook}
      sections={sections}
      assignments={assignments}
      tenant={tenant}
    />
  );
}

function EditLookbookClient({ lookbookId, lookbook, sections, assignments, tenant }: {
  lookbookId: string;
  lookbook: typeof MOCK_LOOKBOOKS[0];
  sections: typeof MOCK_SECTIONS;
  assignments: typeof MOCK_LOOKBOOK_PRODUCTS;
  tenant: typeof MOCK_TENANT;
}) {
  const [step, setStep]       = useState<Step>("Template");
  const [publishUrl, setPublishUrl] = useState(lookbook.published_url);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepIdx = STEPS.indexOf(step);

  function handlePublish() {
    startTransition(async () => {
      const result = await publishLookbook(lookbook.id, tenant.id, tenant.slug);
      if (result.error) {
        setPublishMsg(`Error: ${result.error}`);
      } else {
        setPublishUrl(result.url ?? null);
        setPublishMsg("Published!");
      }
    });
  }

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Lookbooks", href: "/builder" }, { label: lookbook.title }]} />
          <h1 className="platform-page__title">{lookbook.title}</h1>
        </div>
        <a href={`/builder/${lookbookId}/ai-assist`} className="ai-write-btn" style={{ textDecoration: "none" }}>
          <span className="ai-icon">✦</span>
          AI Layout
        </a>
      </div>

      {/* Step indicator */}
      <div className="builder-steps">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`builder-step${step === s ? " builder-step--active" : ""}${i < stepIdx ? " builder-step--done" : ""}`}
            onClick={() => setStep(s)}
          >
            <span className="builder-step__num">{i + 1}</span>
            <span className="builder-step__label">{s}</span>
          </button>
        ))}
      </div>

      {/* Step panels */}
      <div className="builder-panel">
        {step === "Template" && (
          <div className="builder-panel__content">
            <p className="builder-panel__title">Selected template</p>
            <div className="builder-template-display">
              <p className="builder-template-display__name">{lookbook.template_id}</p>
              <p className="builder-template-display__hint">
                Go to{" "}
                <button type="button" className="link-btn" onClick={() => setStep("Sections")}>
                  Sections
                </button>{" "}
                to configure your layout.
              </p>
            </div>
            <div className="builder-panel__footer">
              <button type="button" className="btn btn--primary" onClick={() => setStep("Sections")}>
                Next: Sections
              </button>
            </div>
          </div>
        )}

        {step === "Sections" && (
          <div className="builder-panel__content">
            <p className="builder-panel__title">Sections</p>
            <SectionList
              lookbookId={lookbookId}
              tenantId={tenant.id}
              initial={sections}
            />
            <div className="builder-panel__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setStep("Template")}>Back</button>
              <button type="button" className="btn btn--primary" onClick={() => setStep("Products")}>Next: Products</button>
            </div>
          </div>
        )}

        {step === "Products" && (
          <div className="builder-panel__content">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p className="builder-panel__title" style={{ margin: 0 }}>Assign products to sections</p>
              <GroupingAdvisor
                tenantId={tenant.id}
                products={MOCK_PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category, tags: p.tags, price: p.price }))}
                onApply={grouping => console.log("Apply grouping", grouping)}
              />
            </div>
            {sections.filter(s => s.type === "product_grid").length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__text">Add a Product Grid section first.</p>
                <button type="button" className="btn btn--ghost" onClick={() => setStep("Sections")}>
                  Go to Sections
                </button>
              </div>
            ) : (
              <ProductAssigner
                lookbookId={lookbookId}
                tenantId={tenant.id}
                allProducts={MOCK_PRODUCTS}
                sections={sections}
                initialAssignments={assignments}
              />
            )}
            <div className="builder-panel__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setStep("Sections")}>Back</button>
              <button type="button" className="btn btn--primary" onClick={() => setStep("Preview & Publish")}>Preview</button>
            </div>
          </div>
        )}

        {step === "Preview & Publish" && (
          <div className="builder-panel__content">
            <BuilderPreview
              lookbook={lookbook}
              sections={sections}
              assignments={assignments}
              products={MOCK_PRODUCTS}
              tenant={tenant}
            />
            <div className="builder-panel__footer builder-panel__footer--publish">
              {publishUrl && (
                <p className="publish-url">
                  <span>Published URL: </span>
                  <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="publish-url__link">
                    {publishUrl}
                  </a>
                  <button
                    type="button"
                    className="btn btn--ghost publish-url__copy"
                    onClick={() => navigator.clipboard.writeText(publishUrl)}
                  >
                    Copy
                  </button>
                </p>
              )}
              {publishMsg && (
                <p className={publishMsg.startsWith("Error") ? "form-error" : "form-success"}>
                  {publishMsg}
                </p>
              )}
              <button type="button" className="btn btn--ghost" onClick={() => setStep("Products")}>Back</button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handlePublish}
                disabled={isPending}
              >
                {isPending ? "Publishing…" : publishUrl ? "Re-publish" : "Publish lookbook"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
