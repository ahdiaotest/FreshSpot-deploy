"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LivePanel } from "./LivePanel";
import { VouchersPanel } from "./VouchersPanel";
import { ReportStatusForm } from "./ReportStatusForm";
import { PostVoucherForm } from "./PostVoucherForm";
import {
  mergeLocals,
  readLocalStatuses,
  writeLocalStatuses,
} from "./localStatuses";
import type { StatusWithPlace } from "./StatusCard";
import {
  DEFAULT_TTL_MINUTES,
  type Category,
  type Place,
  type StatusReport,
  type Voucher,
} from "@/lib/types";

type Tab = "live" | "vouchers";

export function HomeApp() {
  const [tab, setTab] = useState<Tab>("live");
  const [category, setCategory] = useState<Category | "all">("all");
  const [places, setPlaces] = useState<Place[]>([]);
  const [statuses, setStatuses] = useState<StatusWithPlace[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [claimBanner, setClaimBanner] = useState<string | null>(null);
  const [postBanner, setPostBanner] = useState<string | null>(null);
  const localStatusesRef = useRef<StatusWithPlace[]>([]);
  const loadGenRef = useRef(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const locals = readLocalStatuses();
    localStatusesRef.current = locals;
    if (locals.length) {
      setStatuses((prev) => {
        const ids = new Set(prev.map((s) => s.id));
        const add = locals.filter((l) => !ids.has(l.id));
        return add.length ? [...add, ...prev] : prev;
      });
    }
  }, []);

  const load = useCallback(async () => {
    const gen = ++loadGenRef.current;
    try {
      const [pRes, sRes, vRes] = await Promise.all([
        fetch("/api/places"),
        fetch("/api/statuses"),
        fetch("/api/vouchers"),
      ]);
      const p = await pRes.json();
      const s = await sRes.json();
      const v = await vRes.json();
      if (gen !== loadGenRef.current) return;
      const fromServer: StatusWithPlace[] = s.statuses ?? [];
      const fromStore = readLocalStatuses();
      const combinedLocals = [
        ...localStatusesRef.current,
        ...fromStore.filter(
          (x) => !localStatusesRef.current.some((l) => l.id === x.id)
        ),
      ];
      const { merged, keptLocals } = mergeLocals(combinedLocals, fromServer);
      localStatusesRef.current = keptLocals;
      writeLocalStatuses(keptLocals);
      setPlaces(p.places ?? []);
      setStatuses(merged);
      setVouchers(v.vouchers ?? []);
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!claimBanner) return;
    const t = setTimeout(() => setClaimBanner(null), 12_000);
    return () => clearTimeout(t);
  }, [claimBanner]);

  useEffect(() => {
    if (!postBanner) return;
    const t = setTimeout(() => setPostBanner(null), 4_000);
    return () => clearTimeout(t);
  }, [postBanner]);

  const now = Date.now();
  const activeStatuses = statuses.filter(
    (s) => !(s.expired === true || new Date(s.expiresAt).getTime() <= now)
  );
  const filtered = activeStatuses.filter((s) =>
    category === "all" ? true : s.place?.category === category
  );
  const showCategoryChips = activeStatuses.length > 0;
  const openVouchers = vouchers.filter((v) => v.status === "open");
  const claimedVouchers = vouchers.filter((v) => v.status === "claimed");

  function handleClaimed(code: string) {
    setClaimBanner(code);
    void load();
  }

  function rememberCreated(created: StatusReport) {
    const place = places.find((p) => p.id === created.placeId) ?? null;
    const item: StatusWithPlace = { ...created, place, expired: false };
    localStatusesRef.current = [
      item,
      ...localStatusesRef.current.filter((s) => s.id !== item.id),
    ];
    writeLocalStatuses(localStatusesRef.current);
    loadGenRef.current += 1;
    setStatuses((prev) =>
      prev.some((s) => s.id === item.id) ? prev : [item, ...prev]
    );
    setShowReport(false);
    setLoading(false);
    setTab("live");
    const ttlMin = Math.max(
      1,
      Math.round((new Date(created.expiresAt).getTime() - Date.now()) / 60_000) ||
        DEFAULT_TTL_MINUTES
    );
    setPostBanner(`Posted · 已发布 · live ~${ttlMin} min · 约${ttlMin}分钟`);
    window.setTimeout(() => void load(), 800);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            鲜点 <span className="text-emerald-600">FreshSpot</span>
          </h1>
          <p className="text-[11px] text-stone-500">
            JB live status + vouchers · 新山实况与券池
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setTab("live")}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === "live" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"
            }`}
          >
            看实况 · Live
          </button>
          <button
            type="button"
            onClick={() => setTab("vouchers")}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === "vouchers" ? "bg-white text-violet-700 shadow-sm" : "text-stone-500"
            }`}
          >
            券池 · Vouchers
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4 pb-28">
        {loading && (
          <p className="py-8 text-center text-sm text-stone-400">Loading… 加载中</p>
        )}
        {!loading && tab === "live" && (
          <LivePanel
            category={category}
            setCategory={setCategory}
            showCategoryChips={showCategoryChips}
            filtered={filtered}
            postBanner={postBanner}
          />
        )}
        {!loading && tab === "vouchers" && (
          <VouchersPanel
            claimBanner={claimBanner}
            openVouchers={openVouchers}
            claimedVouchers={claimedVouchers}
            onClaimed={handleClaimed}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        {tab === "live" ? (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            Report status · 报实况 · Laporkan
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPost(true)}
            className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            Post voucher · 放券 · Kongsi baucar
          </button>
        )}
      </div>

      {showReport && (
        <ReportStatusForm
          places={places}
          onCancel={() => setShowReport(false)}
          onDone={rememberCreated}
        />
      )}
      {showPost && (
        <PostVoucherForm
          onCancel={() => setShowPost(false)}
          onDone={() => {
            setShowPost(false);
            load();
          }}
        />
      )}
    </div>
  );
}
