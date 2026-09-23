"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function useHomeApp() {
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

  return {
    tab, setTab, category, setCategory, places, statuses, vouchers,
    loading, showReport, setShowReport, showPost, setShowPost,
    claimBanner, postBanner, showCategoryChips, filtered,
    openVouchers, claimedVouchers, handleClaimed, rememberCreated, load,
  };
}
