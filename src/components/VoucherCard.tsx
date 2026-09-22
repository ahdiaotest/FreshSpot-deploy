"use client";

import { useEffect, useState } from "react";
import type { Voucher } from "@/lib/types";

const STORAGE_PREFIX = "freshspot:voucher-code:";

function readStoredCode(id: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + id);
  } catch {
    return null;
  }
}

function storeCode(id: string, code: string) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + id, code);
  } catch {
    /* ignore quota / private mode */
  }
}

export function VoucherCard({
  voucher,
  onClaimed,
}: {
  voucher: Voucher;
  onClaimed: (code: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const open = voucher.status === "open";

  useEffect(() => {
    const stored = readStoredCode(voucher.id);
    if (stored) setRevealed(stored);
  }, [voucher.id]);

  async function claim() {
    if (!open || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/vouchers/${voucher.id}/claim`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      const code = data.voucher.code as string;
      storeCode(voucher.id, code);
      setRevealed(code);
      onClaimed(code);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        open ? "border-violet-200 bg-white" : "border-stone-100 bg-stone-50 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-stone-900">
            {voucher.merchant}
          </p>
          {voucher.note && (
            <p className="mt-1 text-sm text-stone-600">{voucher.note}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
            open ? "bg-violet-100 text-violet-700" : "bg-stone-200 text-stone-500"
          }`}
        >
          {open ? "Open · 可领" : "Claimed · 已领"}
        </span>
      </div>

      {revealed ? (
        <div className="mt-3 rounded-xl bg-violet-50 px-3 py-2">
          <p className="text-xs text-violet-600">Your code · 你的券码</p>
          <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-violet-900">
            {revealed}
          </p>
        </div>
      ) : open ? (
        <p className="mt-3 font-mono text-sm text-stone-400 tracking-wider">
          ••••••••
        </p>
      ) : (
        <p className="mt-3 text-xs text-stone-400">Code hidden · 券码已隐藏</p>
      )}

      {voucher.expiry && (
        <p className="mt-2 text-[11px] text-stone-400">
          Expires · 有效至 {new Date(voucher.expiry).toLocaleDateString("en-MY")}
        </p>
      )}

      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}

      {open && !revealed && (
        <button
          type="button"
          disabled={busy}
          onClick={claim}
          className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Claiming…" : "Claim · 领取 · Ambil"}
        </button>
      )}
    </article>
  );
}
