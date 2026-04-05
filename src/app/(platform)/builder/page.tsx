import { MOCK_LOOKBOOKS } from "@/lib/mock/data";
import Link from "next/link";

export const metadata = { title: "Lookbooks — DLookBook" };

const STATUS_CLASS: Record<string, string> = {
  published: "status-badge--active",
  draft:     "status-badge--draft",
  archived:  "status-badge--archived",
};

export default async function BuilderPage() {
  // TODO: fetch from Supabase when !TEST_MODE
  const lookbooks = MOCK_LOOKBOOKS;

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <h1 className="platform-page__title">Lookbooks</h1>
          <p className="platform-page__sub">{lookbooks.length} lookbook{lookbooks.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/builder/new" className="btn btn--primary">+ New Lookbook</Link>
      </div>

      {lookbooks.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">No lookbooks yet.</p>
          <Link href="/builder/new" className="btn btn--primary">Create your first lookbook</Link>
        </div>
      ) : (
        <div className="lookbook-grid">
          {lookbooks.map(lb => (
            <div key={lb.id} className="lookbook-card">
              <div className="lookbook-card__preview" />
              <div className="lookbook-card__body">
                <p className="lookbook-card__title">{lb.title}</p>
                <p className="lookbook-card__desc">{lb.description}</p>
                <div className="lookbook-card__footer">
                  <span className={`status-badge ${STATUS_CLASS[lb.status] ?? ""}`}>
                    {lb.status}
                  </span>
                  <div className="lookbook-card__actions">
                    <Link href={`/builder/${lb.id}/edit`} className="lookbook-card__edit">
                      Edit
                    </Link>
                    {lb.status === "published" && lb.published_url && (
                      <a
                        href={lb.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lookbook-card__edit"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
