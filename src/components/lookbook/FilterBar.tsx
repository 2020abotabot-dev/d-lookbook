"use client";

import { useFilter } from "@/lib/filter-context";

interface FilterGroup {
  key: "activity" | "protection" | "gender";
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  groups?: FilterGroup[];
}

// Default filter groups — tenant can override by passing custom groups
const DEFAULT_GROUPS: FilterGroup[] = [
  {
    key: "activity",
    options: [
      { value: "Water",         label: "Water" },
      { value: "Light Hiking",  label: "Light Hike" },
      { value: "Trail Running", label: "Trail Run" },
      { value: "Casual",        label: "Casual" },
    ],
  },
  {
    key: "protection",
    options: [
      { value: "GTX",     label: "GTX" },
      { value: "Non-GTX", label: "Non-GTX" },
    ],
  },
  {
    key: "gender",
    options: [
      { value: "Men's",   label: "Men's" },
      { value: "Women's", label: "Women's" },
      { value: "Unisex",  label: "Unisex" },
    ],
  },
];

const TOGGLE_FN_MAP = {
  activity:   "toggleActivity",
  protection: "toggleProtection",
  gender:     "toggleGender",
} as const;

export default function FilterBar({ groups = DEFAULT_GROUPS }: FilterBarProps) {
  const { filter, toggleActivity, toggleProtection, toggleGender, clear, isActive } = useFilter();

  const toggleFns = { toggleActivity, toggleProtection, toggleGender };

  return (
    <div className="fbar">
      {groups.map((group, i) => (
        <>
          {i > 0 && <div key={`div-${group.key}`} className="fbar__divider" />}
          <div key={group.key} className="fbar__group">
            {group.options.map(opt => (
              <button
                key={opt.value}
                className={`fbar__pill${filter[group.key] === opt.value ? " fbar__pill--on" : ""}`}
                onClick={() => toggleFns[TOGGLE_FN_MAP[group.key]](opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      ))}

      {isActive && (
        <>
          <div className="fbar__divider" />
          <button className="fbar__clear" onClick={clear}>
            Clear
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
