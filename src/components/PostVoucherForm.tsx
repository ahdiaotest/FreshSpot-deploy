"use client";

import { useState } from "react";

export function PostVoucherForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [merchant, setMerchant] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          code,
          note,
          expiry: expiry || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            Post voucher · 放券
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1 text-sm text-stone-500"
          >
            Close · 关闭
          </button>
        </div>

        <p className="mb-3 text-xs text-stone-400">Step {step}/3</p>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">
              1. Merchant · 商家
            </p>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Ah Ma Banana Cake"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />
            <button
              type="button"
              disabled={!merchant.trim()}
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next · 下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">
              2. Code + note · 券码 + 备注
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Voucher code / text"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note · 备注"
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <label className="block text-xs text-stone-500">
              Optional expiry · 可选有效期
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium"
              >
                Back · 返回
              </button>
              <button
                type="button"
                disabled={!code.trim()}
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next · 下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">
              3. Confirm · 确认提交
            </p>
            <div className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
              <p>
                <span className="text-stone-400">Merchant: </span>
                {merchant}
              </p>
              <p className="mt-1">
                <span className="text-stone-400">Code: </span>
                <span className="font-mono">{code}</span>
              </p>
              {note && (
                <p className="mt-1">
                  <span className="text-stone-400">Note: </span>
                  {note}
                </p>
              )}
              {expiry && (
                <p className="mt-1">
                  <span className="text-stone-400">Expiry: </span>
                  {expiry}
                </p>
              )}
            </div>
            {err && <p className="text-xs text-rose-600">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium"
              >
                Back · 返回
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Posting…" : "Post · 发布 · Kongsi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
