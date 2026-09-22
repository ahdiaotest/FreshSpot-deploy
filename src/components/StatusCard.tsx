"use client";

import { Countdown } from "./Countdown";
import { STATUS_LABELS, type Place, type StatusType } from "@/lib/types";

export type StatusWithPlace = {
  id: string;
  placeId: string;
  statusType: StatusType;
  note: string;
  createdAt: string;
  expiresAt: string;
  expired?: boolean;
  place: Place | null;
};

export function StatusCard({ status }: { status: StatusWithPlace }) {
  const label = STATUS_LABELS[status.statusType];
  const place = status.place;
  const expired = status.expired ?? new Date(status.expiresAt).getTime() <= Date.now();

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition ${
        expired
          ? "border-stone-100 bg-stone-50 opacity-60"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-stone-900">
            {place ? `${place.nameCn} · ${place.name}` : "Unknown place"}
          </p>
          {place && (
            <p className="mt-0.5 text-xs text-stone-500">
              {place.area} · {place.category}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
            expired
              ? "bg-stone-200 text-stone-500"
              : statusColor(status.statusType)
          }`}
        >
          {label.emoji} {label.cn}
        </span>
      </div>
      {status.note && (
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          {status.note}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        {expired ? (
          <span className="text-xs font-medium text-stone-400">
            Expired · 已过期
          </span>
        ) : (
          <Countdown expiresAt={status.expiresAt} />
        )}
        <span className="text-[11px] text-stone-400">
          {formatRel(status.createdAt)}
        </span>
      </div>
    </article>
  );
}

function statusColor(t: StatusType) {
  switch (t) {
    case "sold_out":
      return "bg-rose-100 text-rose-700";
    case "queue_wait":
      return "bg-amber-100 text-amber-800";
    case "open_slots":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-sky-100 text-sky-800";
  }
}

function formatRel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
