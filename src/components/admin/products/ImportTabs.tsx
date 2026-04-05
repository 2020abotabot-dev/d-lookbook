"use client";

import { useState } from "react";
import type { DbProduct } from "@/types/database";
import CSVImporter from "./CSVImporter";
import ExcelImporter from "./ExcelImporter";
import FolderImporter from "./FolderImporter";
import ImageImporter from "./ImageImporter";

const TABS = ["CSV", "Excel", "Folder", "Images", "Google Sheets"] as const;
type Tab = typeof TABS[number];

interface ImportTabsProps {
  tenantId: string;
  products: DbProduct[];
}

export default function ImportTabs({ tenantId, products }: ImportTabsProps) {
  const [active, setActive] = useState<Tab>("CSV");

  return (
    <div className="import-tabs">
      <div className="import-tabs__bar">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            className={`import-tabs__tab${active === t ? " import-tabs__tab--active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="import-tabs__content">
        {active === "CSV"     && <CSVImporter tenantId={tenantId} />}
        {active === "Excel"   && <ExcelImporter tenantId={tenantId} />}
        {active === "Folder"  && <FolderImporter tenantId={tenantId} />}
        {active === "Images"  && <ImageImporter tenantId={tenantId} products={products} />}
        {active === "Google Sheets" && (
          <div className="importer importer--stub">
            <p className="importer__stub-title">Google Sheets</p>
            <p className="importer__stub-desc">
              Google Sheets integration is coming soon. In the meantime, export your sheet as CSV
              and use the CSV tab.
            </p>
            <div className="importer__stub-instructions">
              <p className="importer__stub-step">
                <strong>How to export from Google Sheets:</strong>
              </p>
              <ol>
                <li>Open your Google Sheet</li>
                <li>File &rarr; Download &rarr; Comma-separated values (.csv)</li>
                <li>Import the downloaded file using the CSV tab above</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
