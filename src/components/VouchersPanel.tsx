"use client";

import { VoucherCard } from "./VoucherCard";
import type { Voucher } from "@/lib/types";

export function VouchersPanel({
  claimBanner,
  openVouchers,
  claimedVouchers,
  onClaimed,
}: {
  claimBanner: string | null;
  openVouchers: Voucher[];
  claimedVouchers: Voucher[];
  onClaimed: (code: string) => void;
}) {
  return (
    <>
      {claimBanner && (
        <div
          role="status"
          className="rounded-2xl border border-violet-300 bg-violet-100 px-4 py-3 shadow-sm"
        >
          <p className="text-xs font-semibold text-violet-700">
            Claimed · 领取成功 · Berjaya
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-wide text-violet-900">
            {claimBanner}
          </p>
          <p className="mt-1 text-[11px] text-violet-600">
            Code saved for this session · 本会话已保存券码
          </p>
        </div>
      )}
      <p className="text-xs text-stone-500">
        First-come claim · 先到先得 · Siapa cepat
      </p>
      {openVouchers.length === 0 && claimedVouchers.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">
          No vouchers · 暂无券
        </p>
      )}
      {openVouchers.map((v) => (
        <VoucherCard key={v.id} voucher={v} onClaimed={onClaimed} />
      ))}
      {claimedVouchers.length > 0 && (
        <>
          <p className="pt-2 text-xs font-medium text-stone-400">
            Recently claimed · 最近已领
          </p>
          {claimedVouchers.slice(0, 5).map((v) => (
            <VoucherCard key={v.id} voucher={v} onClaimed={onClaimed} />
          ))}
        </>
      )}
    </>
  );
}
