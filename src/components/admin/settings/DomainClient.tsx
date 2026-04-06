"use client";

import { useState, useTransition } from "react";
import { saveCustomDomain } from "@/app/actions/branding";

interface Props {
  tenantId:      string;
  slug:          string;
  initialDomain: string;
}

export default function DomainClient({ tenantId, slug, initialDomain }: Props) {
  const [domain, setDomain]   = useState(initialDomain);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const result = await saveCustomDomain(tenantId, domain);
      if (result.success) setSaved(true);
      else setError(result.error ?? "Failed to save");
    });
  }

  return (
    <div className="settings-sections">
      <section className="settings-section">
        <h2 className="settings-section__title">Subdomain</h2>
        <div className="settings-form">
          <label className="settings-label">
            Your lookbook URL
            <div className="settings-slug">
              <span className="settings-slug__prefix">https://</span>
              <input className="settings-input" value={slug} disabled />
              <span className="settings-slug__suffix">.dlookbook.com</span>
            </div>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Custom domain</h2>
        <div className="settings-form">
          <label className="settings-label">
            Domain
            <input
              className="settings-input"
              placeholder="lookbook.yourbrand.com"
              value={domain}
              onChange={e => { setDomain(e.target.value); setSaved(false); }}
            />
          </label>

          {domain && (
            <div className="dns-instructions">
              <p className="dns-instructions__title">DNS configuration</p>
              <p className="dns-instructions__desc">Add the following record to your DNS provider:</p>
              <div className="dns-record">
                <span className="dns-record__type">CNAME</span>
                <span className="dns-record__name">{domain}</span>
                <span className="dns-record__value">cname.dlookbook.com</span>
              </div>
              <div className="domain-status domain-status--pending">Pending verification</div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {saved && <p className="form-success">Domain saved</p>}

          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save domain"}
          </button>
        </div>
      </section>
    </div>
  );
}
