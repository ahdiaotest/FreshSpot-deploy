"use client";

import { CATEGORY_LABELS, type Category } from "@/lib/types";

const ORDER: Array<Category | "all"> = [
  "all",
  "food",
  "dessert",
  "cafe",
  "carwash",
  "massage",
  "other",
];

export function CategoryChips({
  value,
  onChange,
}: {
  value: Category | "all";
  onChange: (v: Category | "all") => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {ORDER.map((key) => {
        const label = CATEGORY_LABELS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {label.cn} {label.en}
          </button>
        );
      })}
    </div>
  );
}
