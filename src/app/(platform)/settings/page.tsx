import Link from "next/link";

export const metadata = { title: "Settings — DLookBook" };

const SECTIONS = [
  {
    href:  "/settings/branding",
    title: "Branding",
    desc:  "Logo, colors, fonts, and the visual identity of your lookbooks.",
  },
  {
    href:  "/settings/domain",
    title: "Domain",
    desc:  "Configure your subdomain and map a custom domain.",
  },
  {
    href:  "/settings/team",
    title: "Team",
    desc:  "Invite collaborators and manage roles.",
  },
  {
    href:  "/settings/billing",
    title: "Billing",
    desc:  "Plan details, usage, and payment information.",
  },
];

export default function SettingsPage() {
  return (
    <div className="platform-page">
      <div className="platform-page__header">
        <div>
          <h1 className="platform-page__title">Settings</h1>
          <p className="platform-page__sub">Manage your workspace configuration</p>
        </div>
      </div>

      <div className="settings-hub">
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} className="settings-hub-card">
            <p className="settings-hub-card__title">{s.title}</p>
            <p className="settings-hub-card__desc">{s.desc}</p>
            <span className="settings-hub-card__arrow">&#8594;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
