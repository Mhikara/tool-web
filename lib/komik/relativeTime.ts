"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export function relativeTime(iso?: string | null, now = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "Baru saja";
  if (s < 3600) return Math.floor(s / 60) + "m lalu";
  if (s < 86400) return Math.floor(s / 3600) + "j lalu";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "h lalu";
  return Math.floor(s / (86400 * 7)) + "mg lalu";
}

/** Satu jam global — semua komponen share, tidak nambah interval */
let nowMs = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function start() {
  if (timer) return;
  timer = setInterval(() => {
    nowMs = Date.now();
    listeners.forEach((l) => l());
  }, 60_000); // 1 menit sekali
}

function stop() {
  if (listeners.size === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
    stop();
  };
}

function getSnapshot() {
  return nowMs;
}

/** Pakai di card: const now = useSharedNow(); relativeTime(iso, now) */
export function useSharedNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
