"use client";

import { useState, useTransition } from "react";
import type { TenantBranding } from "@/types/tenant";
import { saveBranding } from "@/app/actions/branding";
import { TEST_MODE } from "@/lib/test-mode";
import ColorPicker from "./ColorPicker";
import FontSelector from "./FontSelector";
import LogoUpload from "./LogoUpload";
import BrandingPreview from "./BrandingPreview";

interface BrandingFormProps {
  tenantId: string;
  tenantName: string;
  initial: TenantBranding;
}

export default function BrandingForm({ tenantId, tenantName, initial }: BrandingFormProps) {
  const [branding, setBranding] = useState<TenantBranding>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(patch: Partial<TenantBranding>) {
    setBranding(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const result = await saveBranding(tenantId, branding);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <div className="branding-layout">
      <div className="branding-fields">
        <section className="settings-section">
          <h2 className="settings-section__title">Logo &amp; Favicon</h2>
          <div className="settings-form">
            <LogoUpload
              label="Logo"
              value={branding.logo_url}
              onChange={v => update({ logo_url: v })}
            />
            <LogoUpload
              label="Favicon"
              value={branding.favicon_url}
              onChange={v => update({ favicon_url: v })}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section__title">Colors</h2>
          <div className="settings-colors">
            <ColorPicker
              label="Primary"
              value={branding.primary_color}
              onChange={v => update({ primary_color: v })}
            />
            <ColorPicker
              label="Secondary"
              value={branding.secondary_color}
              onChange={v => update({ secondary_color: v })}
            />
            <ColorPicker
              label="Accent"
              value={branding.accent_color}
              onChange={v => update({ accent_color: v })}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section__title">Typography</h2>
          <div className="settings-form">
            <FontSelector
              label="Heading font"
              value={branding.font_heading}
              onChange={v => update({ font_heading: v })}
            />
            <FontSelector
              label="Body font"
              value={branding.font_body}
              onChange={v => update({ font_body: v })}
            />
          </div>
        </section>

        <div className="branding-actions">
          {error && <p className="form-error">{error}</p>}
          {saved && (
            <p className="form-success">
              {TEST_MODE ? "Saved (test mode — not persisted)" : "Saved!"}
            </p>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save branding"}
          </button>
        </div>
      </div>

      <div className="branding-preview-col">
        <BrandingPreview branding={branding} tenantName={tenantName} />
      </div>
    </div>
  );
}
