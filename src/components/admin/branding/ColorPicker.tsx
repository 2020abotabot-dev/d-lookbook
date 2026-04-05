"use client";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="settings-label">
      {label}
      <div className="color-picker">
        <input
          type="color"
          className="color-picker__swatch"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="text"
          className="settings-input color-picker__hex"
          value={value}
          maxLength={7}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
        />
      </div>
    </label>
  );
}
