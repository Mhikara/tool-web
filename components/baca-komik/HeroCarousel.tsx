"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

type Item = {
  id: string;
  title: string;
  cover?: string | null;
  rating?: number | string | null;
};

function coverSrc(c?: string | null) {
  if (!c) return null;
  if (c.startsWith("/api/")) return c;
  if (c.startsWith("http"))
    return "/api/komik/image?url=" + encodeURIComponent(c);
  return c;
}

export default function HeroCarousel({ items }: { items: Item[] }) {
  const list = (items || []).filter((x) => x.id).slice(0, 8);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % list.length), 4500);
    return () => clearInterval(t);
  }, [list.length]);

  if (!list.length) {
    return (
      <div className="mx-3 h-48 animate-pulse rounded-2xl bg-zinc-800" />
    );
  }

  const cur = list[i % list.length];
  const c = coverSrc(cur.cover);

  return (
    <div className="relative mx-3 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10">
      <div className="relative aspect-[16/10] sm:aspect-[21/9]">
        {c ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c}
            alt={cur.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-30">
            📖
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {cur.rating != null && (
          <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-bold text-amber-300">
            ★ {cur.rating}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="mb-2 line-clamp-2 text-lg font-bold text-white drop-shadow">
            {cur.title}
          </p>
          <Link
            href={"/tools/baca-komik/" + encodeURIComponent(cur.id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white"
          >
            <BookOpen className="h-3.5 w-3.5" /> READ NOW
          </Link>
        </div>
        <button
          type="button"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
          onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
          onClick={() => setI((v) => (v + 1) % list.length)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex justify-center gap-1.5 pb-2">
        {list.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setI(idx)}
            className={
              "h-1 rounded-full transition-all " +
              (idx === i % list.length ? "w-4 bg-red-500" : "w-1.5 bg-white/30")
            }
          />
        ))}
      </div>
    </div>
  );
}
