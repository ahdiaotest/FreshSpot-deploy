"use client";

import { useState } from "react";
import {
  STATUS_LABELS,
  type Place,
  type StatusReport,
  type StatusType,
} from "@/lib/types";

const TYPES: StatusType[] = [
  "sold_out",
  "queue_wait",
  "open_slots",
  "custom",
];

export function ReportStatusForm({
  places,
  onDone,
  onCancel,
}: {
  places: Place[];
  onDone: (status: StatusReport) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [placeId, setPlaceId] = useState("");
  const [statusType, setStatusType] = useState<StatusType | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(type: StatusType, noteValue: string) {
    if (!placeId || !type) return;
    if (type === "custom" && !noteValue.trim()) {
      setErr("Custom status needs a note · 自定义需要备注");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, statusType: type, note: noteValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      // Pass created status so HomeApp can optimistic-prepend (Vercel multi-instance GET may miss)
      if (!data.status?.id) throw new Error(data.error || "No status returned");
      onDone(data.status as StatusReport);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function pickType(t: StatusType) {
    setStatusType(t);
    setErr("");
    if (t !== "custom") {
      // Report + place + type = 3 taps; no Next/confirm step
      void submit(t, note);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            Report · 报实况
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1 text-sm text-stone-500"
          >
            Close · 关闭
          </button>
        </div>

        <p className="mb-3 text-xs text-stone-400">Step {step}/2</p>

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">
              1. Place · 地点
            </p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {places.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlaceId(p.id);
                    setStep(2);
                  }}
                  className={`flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition ${
                    placeId === p.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <span className="font-medium text-stone-900">
                    {p.nameCn} · {p.name}
                  </span>
                  <span className="text-xs text-stone-500">{p.area}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">
              2. Status · 状态
              <span className="ml-1 font-normal text-stone-400">
                (tap type to submit · 点选即提交)
              </span>
            </p>
            <p className="text-xs text-stone-500">
              {places.find((p) => p.id === placeId)?.nameCn} ·{" "}
              {places.find((p) => p.id === placeId)?.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => {
                const l = STATUS_LABELS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={busy}
                    onClick={() => pickType(t)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-medium disabled:opacity-50 ${
                      statusType === t
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-stone-200"
                    }`}
                  >
                    {l.emoji} {l.cn}
                    <span className="mt-0.5 block text-[11px] font-normal text-stone-500">
                      {l.en}
                      {t !== "custom" ? " · submit" : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {statusType === "custom" && (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note · 备注 (required for custom)"
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  onClick={() => submit("custom", note)}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {busy ? "Submitting…" : "Submit · 提交 · Hantar"}
                </button>
              </>
            )}

            {err && <p className="text-xs text-rose-600">{err}</p>}
            {busy && statusType !== "custom" && (
              <p className="text-center text-xs text-stone-400">Submitting…</p>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep(1);
                setStatusType("");
                setErr("");
              }}
              className="w-full rounded-xl border border-stone-200 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Back · 返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
