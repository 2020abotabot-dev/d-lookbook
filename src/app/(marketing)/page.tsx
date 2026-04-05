import Link from "next/link";

export const metadata = {
  title: "DLookBook — Build beautiful lookbooks for your brand",
  description:
    "The white-label lookbook platform. Upload products, customize your brand, publish to your own URL.",
};

export default function MarketingHomePage() {
  return (
    <main className="marketing-hero">
      <div className="marketing-hero__inner">
        <h1 className="marketing-hero__title">
          Build beautiful<br />lookbooks for your brand.
        </h1>
        <p className="marketing-hero__sub">
          Upload products. Customize your branding. Share an interactive lookbook
          with buyers — no developers needed.
        </p>
        <div className="marketing-hero__cta">
          <Link href="/signup" className="btn btn--primary">
            Start for free
          </Link>
          <Link href="/login" className="btn btn--ghost">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
