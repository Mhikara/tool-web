"use client";

import { X } from "lucide-react";
import {
  GENRE_OPTIONS,
  type CatalogFilters,
  type ComicStatus,
  type ComicType,
  type Demographic,
  type SortKey,
} from "@/lib/komik/catalogParams";

type Props = {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClose?: () => void;
  variant?: "sidebar" | "drawer";
};

function Section({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
        (active
          ? "bg-violet-600 text-white"
          : "bg-zinc-900 text-zinc-400 ring-1 ring-white/10 hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

export default function FilterPanel({
  filters,
  onChange,
  onClose,
  variant = "sidebar",
}: Props) {
  const toggleGenre = (id: string) => {
    const has = filters.genres.includes(id);
    onChange({
      genres: has
        ? filters.genres.filter((g) => g !== id)
        : [...filters.genres, id],
      page: 1,
    });
  };

  const body = (
    <div className="space-y-5">
      <Section title="Tipe">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Semua"],
              ["manga", "Manga"],
              ["manhwa", "Manhwa"],
              ["manhua", "Manhua"],
            ] as [ComicType, string][]
          ).map(([id, label]) => (
            <Chip
              key={id}
              active={filters.type === id}
              onClick={() => onChange({ type: id, page: 1 })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Status">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Semua"],
              ["ongoing", "Ongoing"],
              ["completed", "Tamat"],
              ["hiatus", "Hiatus"],
              ["cancelled", "Cancelled"],
            ] as [ComicStatus, string][]
          ).map(([id, label]) => (
            <Chip
              key={id}
              active={filters.status === id}
              onClick={() => onChange({ status: id, page: 1 })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Demografi">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Semua"],
              ["shounen", "Shounen"],
              ["shoujo", "Shoujo"],
              ["seinen", "Seinen"],
              ["josei", "Josei"],
            ] as [Demographic, string][]
          ).map(([id, label]) => (
            <Chip
              key={id}
              active={filters.demographic === id}
              onClick={() => onChange({ demographic: id, page: 1 })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Urutkan">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["latest", "Terbaru"],
              ["rating", "Rating"],
              ["followed", "Populer"],
              ["az", "A-Z"],
            ] as [SortKey, string][]
          ).map(([id, label]) => (
            <Chip
              key={id}
              active={filters.sort === id}
              onClick={() => onChange({ sort: id, page: 1 })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Genre (multi)">
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((g) => (
            <Chip
              key={g.id}
              active={filters.genres.includes(g.id)}
              onClick={() => toggleGenre(g.id)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </Section>

      <button
        type="button"
        onClick={() =>
          onChange({
            type: "all",
            status: "all",
            demographic: "all",
            sort: "latest",
            genres: [],
            page: 1,
          })
        }
        className="w-full rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
      >
        Reset filter
      </button>
    </div>
  );

  if (variant === "drawer") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 lg:hidden">
        <button
          type="button"
          className="flex-1"
          aria-label="Tutup"
          onClick={onClose}
        />
        <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-zinc-950 p-4 ring-1 ring-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Filter</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <h2 className="mb-3 text-sm font-bold text-zinc-200">Filter</h2>
      {body}
    </aside>
  );
}
