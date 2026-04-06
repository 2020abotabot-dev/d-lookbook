import Link from "next/link";

export const metadata = {
  title: "DLookBook — Beautiful lookbooks for fashion brands",
  description:
    "The white-label lookbook platform. Upload products, customize your brand, publish interactive digital lookbooks — no developers needed.",
};

const FEATURES = [
  {
    icon: "✦",
    title: "Visual builder",
    desc: "Drag-and-drop sections — hero, editorial, product grids, campaign banners. Build a full lookbook in minutes.",
  },
  {
    icon: "⬆",
    title: "Bulk product import",
    desc: "Import from CSV, Excel, or a folder of images. Auto-match images to SKUs. Go from spreadsheet to published in one afternoon.",
  },
  {
    icon: "◈",
    title: "Your brand, fully applied",
    desc: "Set your colors, fonts, and logo once. Every lookbook you publish inherits your brand identity automatically.",
  },
  {
    icon: "★",
    title: "AI layout & copy",
    desc: "Let AI suggest product groupings, write editorial copy, and generate hero headlines — then edit freely.",
  },
  {
    icon: "⊞",
    title: "Cinematic sections",
    desc: "Video heroes, parallax editorials, sticky chapter scrolls, and side-scroll panels for high-end presentation.",
  },
  {
    icon: "↗",
    title: "Instant publishing",
    desc: "One click to publish. Share a clean URL with buyers. Republish with updates — no rebuild, no waiting.",
  },
];

const STEPS = [
  { num: "01", title: "Upload your products", desc: "Import from CSV or Excel. Add images, descriptions, pricing, and specs." },
  { num: "02", title: "Configure your brand", desc: "Set your colors, typography, and logo. Applied across all lookbooks." },
  { num: "03", title: "Build your lookbook", desc: "Add sections, assign products, arrange layout — all visual, no code." },
  { num: "04", title: "Publish and share", desc: "Get a shareable URL. Update live anytime without re-sending links." },
];

export default function MarketingHomePage() {
  return (
    <main className="mkt">
      {/* Nav */}
      <nav className="mkt-nav">
        <span className="mkt-nav__logo">DLookBook</span>
        <div className="mkt-nav__links">
          <Link href="/login" className="mkt-nav__link">Log in</Link>
          <Link href="/signup" className="btn btn--primary mkt-nav__cta">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mkt-hero">
        <div className="mkt-hero__inner">
          <div className="mkt-hero__badge">✦ AI-powered lookbook builder</div>
          <h1 className="mkt-hero__title">
            Beautiful lookbooks.<br />Built for fashion brands.
          </h1>
          <p className="mkt-hero__sub">
            Upload your collection, apply your brand, and publish interactive digital lookbooks your buyers will love — in under an hour.
          </p>
          <div className="mkt-hero__cta">
            <Link href="/signup" className="btn btn--primary mkt-btn--lg">
              Start for free
            </Link>
            <Link href="/login" className="btn btn--ghost mkt-btn--lg">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mkt-features">
        <div className="mkt-section-inner">
          <h2 className="mkt-section-title">Everything you need to publish lookbooks</h2>
          <p className="mkt-section-sub">From product import to published URL — all in one platform.</p>
          <div className="mkt-features__grid">
            {FEATURES.map(f => (
              <div key={f.title} className="mkt-feature-card">
                <div className="mkt-feature-card__icon">{f.icon}</div>
                <h3 className="mkt-feature-card__title">{f.title}</h3>
                <p className="mkt-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mkt-steps">
        <div className="mkt-section-inner">
          <h2 className="mkt-section-title">Go from spreadsheet to published in a day</h2>
          <div className="mkt-steps__grid">
            {STEPS.map(s => (
              <div key={s.num} className="mkt-step">
                <div className="mkt-step__num">{s.num}</div>
                <h3 className="mkt-step__title">{s.title}</h3>
                <p className="mkt-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mkt-banner">
        <div className="mkt-section-inner mkt-banner__inner">
          <h2 className="mkt-banner__title">Ready to publish your first lookbook?</h2>
          <p className="mkt-banner__sub">Free to start. No credit card required.</p>
          <Link href="/signup" className="btn btn--primary mkt-btn--lg">
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mkt-footer">
        <span>© {new Date().getFullYear()} DLookBook</span>
        <div className="mkt-footer__links">
          <Link href="/login" className="mkt-footer__link">Log in</Link>
          <Link href="/signup" className="mkt-footer__link">Sign up</Link>
        </div>
      </footer>
    </main>
  );
}
