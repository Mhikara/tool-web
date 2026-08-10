"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { mergeQuery } from "../../../../lib/komik/filterParams";

const DEMOGRAPHICS = [
  { id: "all", label: "Semua demografi" },
  { id: "shounen", label: "Shounen" },
  { id: "shoujo", label: "Shoujo" },
  { id: "seinen", label: "Seinen" },
  { id: "josei", label: "Josei" },
] as const;

const TYPES = [
  { id: "all", label: "Semua tipe" },
  { id: "manhwa", label: "Manhwa" },
  { id: "manhua", label: "Manhua" },
  { id: "manga", label: "Manga" },
] as const;

const STATUSES = [
  { id: "all", label: "Semua status" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Tamat" },
] as const;

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
  const status = searchParams.get("status") || "all";
  const source = searchParams.get("source") || "all";

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", "Semua sumber"],
          ["omega", "Manhwa 18+"],
          ["fullmanhwa", "FullManhwa"],
          ["mangadex", "MangaDex"],
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
        {TYPES.map((t) => (
          <Chip
            key={t.id}
            active={type === t.id}
            onClick={() => setFilter({ type: t.id })}
          >
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEMOGRAPHICS.map((d) => (
          <Chip
            key={d.id}
            active={demographic === d.id}
            onClick={() => setFilter({ demographic: d.id })}
          >
            {d.label}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <Chip
            key={s.id}
            active={status === s.id}
            onClick={() => setFilter({ status: s.id })}
          >
            {s.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
