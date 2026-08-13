"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RecItem = {
  id: string;
  title: string;
  cover?: string | null;
};

function coverUrl(c?: string | null) {
  if (!c) return null;
  if (c.startsWith("/api/")) return c;
  if (c.startsWith("http"))
    return "/api/komik/image?url=" + encodeURIComponent(c);
  return c;
}

/** Seed sederhana dari chapterId agar tiap chapter rekomendasi beda */
function seedFrom(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function ChapterRecs({
  chapterId,
  excludeId,
}: {
  chapterId: string;
  excludeId?: string;
}) {
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/komik?action=home&source=all");
        const data = await res.json().catch(() => ({}));
        const raw = [
          ...(data.latest || []),
          ...(data.popular || []),
          ...(data.list || []),
        ] as any[];

        // unik by id
        const map = new Map<string, RecItem>();
        for (const x of raw) {
          const id = String(x.id || "");
          if (!id || id === excludeId) continue;
          if (map.has(id)) continue;
          map.set(id, {
            id,
            title: x.title || "Tanpa judul",
            cover: x.cover || null,
          });
        }
        let list = Array.from(map.values());
        if (list.length < 5) {
          // fallback search
          const r2 = await fetch(
            "/api/komik?action=search&q=a&source=mangadex"
          );
          const d2 = await r2.json().catch(() => ({}));
          for (const x of d2.list || []) {
            const id = String(x.id || "");
            if (!id || id === excludeId || map.has(id)) continue;
            map.set(id, {
              id,
              title: x.title || "Tanpa judul",
              cover: x.cover || null,
            });
          }
          list = Array.from(map.values());
        }

        // shuffle deterministik per chapter
        const seed = seedFrom(chapterId || "x");
        list = list
          .map((it, i) => ({ it, k: (seed + i * 17) % 9973 }))
          .sort((a, b) => a.k - b.k)
          .map((x) => x.it)
          .slice(0, 8);

        if (alive) setItems(list.slice(0, Math.max(5, Math.min(8, list.length))));
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chapterId, excludeId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-3 py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Rekomendasi
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-2xl border-t border-white/5 px-3 py-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Rekomendasi untukmu
      </p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {items.map((it) => {
          const c = coverUrl(it.cover);
          return (
            <Link
              key={it.id}
              href={"/tools/baca-komik/" + encodeURIComponent(it.id)}
              className="group"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/5">
                {c ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c}
                    alt={it.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm opacity-40">
                    📖
                  </div>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-zinc-400 group-hover:text-zinc-200">
                {it.title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
