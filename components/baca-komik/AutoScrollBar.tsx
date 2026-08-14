"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SPEEDS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export default function AutoScrollBar() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      return;
    }

    // px per detik di 1x ≈ 80; 5x ≈ 400
    const base = 80;
    const step = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000;
      last.current = ts;
      const dy = base * speed * dt;
      window.scrollBy(0, dy);

      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 4) {
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };

    last.current = 0;
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed]);

  // pause saat user scroll manual
  useEffect(() => {
    let touch = false;
    const onTouch = () => {
      touch = true;
      setPlaying(false);
    };
    const onWheel = () => setPlaying(false);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="pointer-events-auto fixed bottom-20 left-1/2 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-950/95 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 fill-current" />
        )}
      </button>

      <span className="w-9 shrink-0 text-center text-[11px] font-bold text-violet-300">
        {speed}x
      </span>

      <input
        type="range"
        min={0}
        max={SPEEDS.length - 1}
        step={1}
        value={Math.max(0, SPEEDS.indexOf(speed as any))}
        onChange={(e) => {
          const i = Number(e.target.value);
          setSpeed(SPEEDS[i] ?? 1);
        }}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500"
      />

      <span className="shrink-0 text-[10px] text-zinc-500">5x</span>
    </div>
  );
}
