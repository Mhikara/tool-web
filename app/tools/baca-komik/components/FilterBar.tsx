"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  mergeQuery,
  GENRE_OPTS,
  TYPE_OPTS,
  DEMO_OPTS,
} from "../../../../lib/komik/filterParams";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition " +
        (active ? "bg-violet-600 text-white" : "bg-zinc-900 text-zinc-400")
      }
    >
      {children}
    </button>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (patch: Record<string, string | null>) => {
      const q = mergeQuery(searchParams, patch);
      router.push(pathname + q, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const type = searchParams.get("type") || "all";
  const demographic = searchParams.get("demographic") || "all";
  const genre = searchParams.get("genre") || "";
  const source = searchParams.get("source") || "all";

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", "Semua"],
          ["mangadex", "MangaDex"],
          ["fullmanhwa", "FullManhwa"],
          ["komiku", "Komiku"],
        ].map(([id, label]) => (
          <Chip
            key={id}
            active={source === id}
            onClick={() => setFilter({ source: id })}
          >
            {label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_OPTS.map((t) => (
          <Chip
            key={t.id}
            active={type === t.id}
            onClick={() => setFilter({ type: t.id === "all" ? null : t.id })}
          >
            {t.label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEMO_OPTS.map((d) => (
          <Chip
            key={d.id}
            active={demographic === d.id}
            onClick={() =>
              setFilter({ demographic: d.id === "all" ? null : d.id })
            }
          >
            {d.label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {GENRE_OPTS.map((g) => (
          <Chip
            key={g.id || "all"}
            active={genre === g.id}
            onClick={() => setFilter({ genre: g.id || null })}
          >
            {g.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
