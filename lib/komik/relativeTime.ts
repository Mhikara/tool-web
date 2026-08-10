"use client";

import { useEffect, useState } from "react";

export function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Baru saja";
  if (s < 3600) return Math.floor(s / 60) + "m lalu";
  if (s < 86400) return Math.floor(s / 3600) + "j lalu";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "h lalu";
  return Math.floor(s / (86400 * 7)) + "mg lalu";
}

export function useRelative(iso?: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!iso) return;
    const tick = () => setLabel(relativeTime(iso));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [iso]);
  return label;
}
