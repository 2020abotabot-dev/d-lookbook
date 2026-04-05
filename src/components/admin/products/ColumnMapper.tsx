"use client";

export type FieldKey =
  | "name" | "sku" | "description" | "price" | "currency"
  | "category" | "subcategory" | "tags" | "status" | "__skip__";

export const FIELD_OPTIONS: { value: FieldKey; label: string; required?: boolean }[] = [
  { value: "name",        label: "Name",        required: true },
  { value: "sku",         label: "SKU",         required: true },
  { value: "description", label: "Description" },
  { value: "price",       label: "Price" },
  { value: "currency",    label: "Currency" },
  { value: "category",    label: "Category" },
  { value: "subcategory", label: "Subcategory" },
  { value: "tags",        label: "Tags" },
  { value: "status",      label: "Status" },
  { value: "__skip__",    label: "— Skip —" },
];

export type ColumnMap = Record<string, FieldKey>;

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMap;
  onChange: (m: ColumnMap) => void;
}

export default function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  function update(header: string, field: FieldKey) {
    onChange({ ...mapping, [header]: field });
  }

  return (
    <div className="column-mapper">
      <p className="column-mapper__title">Map columns to product fields</p>
      <div className="column-mapper__grid">
        {headers.map(h => (
          <div key={h} className="column-mapper__row">
            <span className="column-mapper__header">{h}</span>
            <span className="column-mapper__arrow">&#8594;</span>
            <select
              className="settings-input column-mapper__select"
              value={mapping[h] ?? "__skip__"}
              onChange={e => update(h, e.target.value as FieldKey)}
            >
              {FIELD_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}{f.required ? " *" : ""}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Apply a column mapping to a row of raw cell values */
export function applyMapping(
  headers: string[],
  row: string[],
  mapping: ColumnMap
): Record<FieldKey, string> {
  const result: Partial<Record<FieldKey, string>> = {};
  headers.forEach((h, i) => {
    const field = mapping[h];
    if (field && field !== "__skip__") {
      result[field] = row[i] ?? "";
    }
  });
  return result as Record<FieldKey, string>;
}
