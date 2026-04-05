"use client";

interface SpecsEditorProps {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}

export default function SpecsEditor({ value, onChange }: SpecsEditorProps) {
  const pairs = Object.entries(value);

  function update(idx: number, key: string, val: string) {
    const next = [...pairs];
    next[idx] = [key, val];
    onChange(Object.fromEntries(next));
  }

  function remove(idx: number) {
    const next = pairs.filter((_, i) => i !== idx);
    onChange(Object.fromEntries(next));
  }

  function add() {
    onChange({ ...value, "": "" });
  }

  return (
    <div className="specs-editor">
      {pairs.map(([k, v], i) => (
        <div key={i} className="specs-editor__row">
          <input
            className="settings-input specs-editor__key"
            placeholder="Property"
            value={k}
            onChange={e => update(i, e.target.value, v)}
          />
          <input
            className="settings-input specs-editor__val"
            placeholder="Value"
            value={v}
            onChange={e => update(i, k, e.target.value)}
          />
          <button
            type="button"
            className="specs-editor__remove"
            onClick={() => remove(i)}
            aria-label="Remove spec"
          >
            &#10005;
          </button>
        </div>
      ))}
      <button type="button" className="specs-editor__add" onClick={add}>
        + Add spec
      </button>
    </div>
  );
}
