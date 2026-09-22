"use client";

import type { StatusWithPlace } from "./StatusCard";

export const LOCAL_STATUSES_KEY = "freshspot:local-statuses";

export function readLocalStatuses(): StatusWithPlace[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = localStorage.getItem(LOCAL_STATUSES_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(LOCAL_STATUSES_KEY);
      if (raw) {
        localStorage.setItem(LOCAL_STATUSES_KEY, raw);
        sessionStorage.removeItem(LOCAL_STATUSES_KEY);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StatusWithPlace[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (s) => s?.id && s.expiresAt && new Date(s.expiresAt).getTime() > now
    );
  } catch {
    return [];
  }
}

export function writeLocalStatuses(items: StatusWithPlace[]) {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const active = items.filter(
      (s) => s?.id && new Date(s.expiresAt).getTime() > now
    );
    localStorage.setItem(LOCAL_STATUSES_KEY, JSON.stringify(active));
  } catch {}
}

export function mergeLocals(
  locals: StatusWithPlace[],
  fromServer: StatusWithPlace[]
): { merged: StatusWithPlace[]; keptLocals: StatusWithPlace[] } {
  const now = Date.now();
  const serverIds = new Set(fromServer.map((s) => s.id));
  const keptLocals = locals.filter(
    (l) => !serverIds.has(l.id) && new Date(l.expiresAt).getTime() > now
  );
  return { merged: [...keptLocals, ...fromServer], keptLocals };
}
