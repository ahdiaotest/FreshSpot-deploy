"use client";

import { CategoryChips } from "./CategoryChips";
import { StatusCard, type StatusWithPlace } from "./StatusCard";
import type { Category } from "@/lib/types";

export function LivePanel({
  category,
  setCategory,
  showCategoryChips,
  filtered,
  postBanner,
  onReport,
}: {
  category: Category | "all";
  setCategory: (c: Category | "all") => void;
  showCategoryChips: boolean;
  filtered: StatusWithPlace[];
  postBanner: string | null;
  onReport: () => void;
}) {
  return (
    <>
      {postBanner && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 shadow-sm"
        >
          <p className="text-sm font-semibold text-emerald-800">{postBanner}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700">
            On Live feed · 已出现在实况
          </p>
        </div>
      )}
      {showCategoryChips && (
        <CategoryChips value={category} onChange={setCategory} />
      )}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <button
            type="button"
            onClick={onReport}
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            Report status · 报实况
          </button>
        </div>
      ) : (
        filtered.map((s) => <StatusCard key={s.id} status={s} />)
      )}
    </>
  );
}
