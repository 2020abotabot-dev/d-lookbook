"use client";

export const CURATED_FONTS = [
  "Inter",
  "DM Sans",
  "Outfit",
  "Raleway",
  "Montserrat",
  "Josefin Sans",
  "Playfair Display",
  "Cormorant Garamond",
  "Space Grotesk",
  "Sora",
];

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function FontSelector({ label, value, onChange }: FontSelectorProps) {
  return (
    <label className="settings-label">
      {label}
      <div className="font-selector">
        <select
          className="settings-input font-selector__select"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {CURATED_FONTS.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <span className="font-selector__preview" style={{ fontFamily: value }}>
          Aa — The quick brown fox
        </span>
      </div>
    </label>
  );
}
