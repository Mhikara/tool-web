"use client";
import { GENRES } from "../../lib/komik/comicPrefs";
export default function GenreBar({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {GENRES.map((g) => (
        <button key={g.id || "all"} type="button" onClick={() => onChange(g.id)}
          className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold " + (value === g.id ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-400 ring-1 ring-white/5")}>
          {g.label}
        </button>
      ))}
    </div>
  );
}
