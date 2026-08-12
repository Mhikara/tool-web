"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listDownloads,
  clearDownloads,
  type DownloadRecord,
} from "@/lib/localDownloadDb";
import { downloaderTools } from "@/lib/downloaderTools";
import { makerTools } from "@/lib/makerTools";
import { externalTools } from "@/lib/externalTools";
import { toolsList } from "@/lib/toolsList";

type TabKey = "all" | "downloader" | "maker" | "tools" | "external";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "downloader", label: "Downloader" },
  { key: "maker", label: "Maker" },
  { key: "tools", label: "Tools" },
  { key: "external", label: "External" },
];

function ToolCard({
  href,
  icon,
  title,
  desc,
  tag,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl bg-zinc-900/50 p-4 ring-1 ring-white/5 transition hover:bg-zinc-900 hover:ring-violet-500/30"
    >
      <span className="mb-3 text-2xl leading-none">{icon}</span>
      <span className="text-sm font-semibold text-zinc-100 group-hover:text-white">
        {title}
      </span>
      <span className="mt-1 line-clamp-2 flex-1 text-[12px] leading-relaxed text-zinc-500">
        {desc}
      </span>
      <span className="mt-3 w-fit rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
        {tag}
      </span>
    </Link>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<TabKey>("all");
  const [history, setHistory] = useState<DownloadRecord[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setHistory(listDownloads());
  }, [tab]);

  const query = q.trim().toLowerCase();

  const filterTools = <T extends { title: string; description: string }>(
    list: T[]
  ) =>
    !query
      ? list
      : list.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
        );

  const dl = useMemo(() => filterTools(downloaderTools), [query]);
  const mk = useMemo(() => filterTools(makerTools), [query]);
  const ex = useMemo(() => filterTools(externalTools), [query]);
  const tl = useMemo(() => filterTools(toolsList), [query]);

  const showDl = tab === "all" || tab === "downloader";
  const showMk = tab === "all" || tab === "maker";
  const showEx = tab === "all" || tab === "external";
  const showTl = tab === "all" || tab === "tools";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-black shadow-lg shadow-violet-500/20">
            TW
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold leading-none">Tool Web</p>
            <p className="text-[10px] text-zinc-500">All tools hub</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {/* Search */}
        <div className="mb-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tool..."
            className="w-full rounded-2xl border-0 bg-zinc-900/80 px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-violet-500/40"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition " +
                (tab === t.key
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-white/5 hover:text-zinc-200")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid sections */}
        {showDl && dl.length > 0 && (
          <Section title="Downloader">
            {dl.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={`/downloader/${tool.slug}`}
                icon={tool.icon}
                title={tool.title}
                desc={tool.description}
                tag={tool.tag}
              />
            ))}
          </Section>
        )}

        {showMk && mk.length > 0 && (
          <Section title="Maker">
            {mk.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={`/maker/${tool.slug}`}
                icon={tool.icon}
                title={tool.title}
                desc={tool.description}
                tag={tool.tag}
              />
            ))}
          </Section>
        )}

        {showTl && tl.length > 0 && (
          <Section title="Tools">
            {tl.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={tool.href}
                icon={tool.icon}
                title={tool.title}
                desc={tool.description}
                tag={tool.tag}
              />
            ))}
          </Section>
        )}

        {showEx && ex.length > 0 && (
          <Section title="External">
            {ex.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={`/external/${tool.slug}`}
                icon={tool.icon}
                title={tool.title}
                desc={tool.description}
                tag={tool.tag}
              />
            ))}
          </Section>
        )}

        {/* History — ringkas */}
        {(tab === "all" || tab === "downloader") && (
          <section className="mb-8 rounded-2xl bg-zinc-900/40 p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Riwayat download
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-600">{history.length}</span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearDownloads();
                      setHistory([]);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-center text-xs text-zinc-600">
                Belum ada riwayat di perangkat ini
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 8).map((h) => (
                  <li
                    key={h.id}
                    className="rounded-xl bg-black/20 px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-zinc-200">
                      {h.title || "Tanpa judul"}
                    </p>
                    <p className="text-zinc-600">
                      {h.platform} · {h.mediaType}
                      {h.quality ? " · " + h.quality : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <footer className="border-t border-white/5 py-8 text-center text-[11px] text-zinc-600">
          Tool Web · Developer by{" "}
          <span className="font-semibold text-violet-400/90">Meydi</span>
        </footer>
      </main>
    </div>
  );
}
