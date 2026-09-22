"use client";

import { useEffect, useState } from "react";

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() => msLeft(expiresAt));

  useEffect(() => {
    const tick = () => setLeft(msLeft(expiresAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (left <= 0) {
    return (
      <span className="text-xs font-medium text-stone-400">
        Expired · 已过期
      </span>
    );
  }

  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const urgent = left < 3 * 60_000;

  return (
    <span
      className={`tabular-nums text-xs font-semibold ${
        urgent ? "text-amber-600" : "text-emerald-700"
      }`}
    >
      {m}:{s.toString().padStart(2, "0")} left · 剩余
    </span>
  );
}

function msLeft(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}
