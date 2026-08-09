"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  url: string;
  cover: string | null;
  colored?: boolean;
  colorLabel?: string;
  statusLabel?: string;
  source?: string;
  external?: string;
};

type Chapter = {
  id: string;
  title: string;
  url: string;
  index?: number;
  paid?: boolean;
};

const FAV_KEY = "komik_favorites_v2";
const HIST_KEY = "komik_history_v2";

function loadFav(): Item[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveFav(list: Item[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}
function loadHist(): {
  comicId: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  cover?: string | null;
  at: number;
}[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
  } catch {
    return [];
  }
}
function pushHist(e: {
  comicId: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  cover?: string | null;
}) {
  const list = loadHist().filter(
    (h) => !(h.comicId === e.comicId && h.chapterId === e.chapterId)
  );
  list.unshift({ ...e, at: Date.now() });
  localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 80)));
}

function norm(list: any[]): Item[] {
  return (list || []).map((x) => ({
    id: String(x.id || x.url),
    title: x.title || "Tanpa judul",
    url: String(x.url || x.id),
    cover: x.cover || null,
    colored: x.colored,
    colorLabel: x.colorLabel,
    statusLabel: x.statusLabel,
    source: x.source,
    external: x.external,
  }));
}

export default function BacaKomikPage() {
  const [tab, setTab] = useState<"home" | "fav" | "hist">("home");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<"latest" | "popular" | "rating">("latest");
  const [q, setQ] = useState("");
  const [latest, setLatest] = useState<Item[]>([]);
  const [popular, setPopular] = useState<Item[]>([]);
  const [topRated, setTopRated] = useState<Item[]>([]);
  const [searchList, setSearchList] = useState<Item[] | null>(null);
  const [favs, setFavs] = useState<Item[]>([]);
  const [hist, setHist] = useState<ReturnType<typeof loadHist>>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState<{
    id: string;
    title: string;
    cover: string | null;
    chapters: Chapter[];
    colorLabel?: string;
    statusLabel?: string;
    note?: string;
    external?: string;
  } | null>(null);

  const [reader, setReader] = useState<{
    title: string;
    pages: string[];
    chapterId: string;
    chapterIndex: number;
  } | null>(null);

  const [showBar, setShowBar] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    setFavs(loadFav());
    setHist(loadHist());
  }, []);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setErr("");
    setSearchList(null);
    try {
      const res = await fetch(
        "/api/komik?action=home&source=" + encodeURIComponent(source)
      );
      const data = await res.json();
      setLatest(norm(data.latest || data.list || []));
      setPopular(norm(data.popular || []));
      setTopRated(norm(data.topRated || []));
      if (!(data.latest || data.list || []).length) {
        setErr(data.error || "Kosong");
      }
    } catch (e: any) {
      setErr(e.message || "Gagal");
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (!reader) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 10) setShowBar(false);
      else if (y < lastY.current - 10) setShowBar(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reader]);

  const grid = useMemo(() => {
    if (tab === "fav") return favs;
    if (searchList) return searchList;
    if (sort === "popular") return popular.length ? popular : latest;
    if (sort === "rating") return topRated.length ? topRated : latest;
    return latest;
  }, [tab, favs, searchList, sort, popular, topRated, latest]);

  const search = async () => {
    if (!q.trim()) {
      setSearchList(null);
      return loadHome();
    }
    setLoading(true);
    setErr("");
    setTab("home");
    try {
      const res = await fetch(
        "/api/komik?action=search&q=" +
          encodeURIComponent(q.trim()) +
          "&source=" +
          encodeURIComponent(source)
      );
      const data = await res.json();
      setSearchList(norm(data.list || []));
      if (!data.list?.length) setErr("Tidak ketemu");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isFav = (id: string) => favs.some((f) => f.id === id);

  const toggleFav = (item: Item) => {
    let next: Item[];
    if (isFav(item.id)) next = favs.filter((f) => f.id !== item.id);
    else next = [item, ...favs.filter((f) => f.id !== item.id)];
    setFavs(next);
    saveFav(next);
  };

  const openDetail = async (item: Item) => {
    setLoading(true);
    setErr("");
    setReader(null);
    try {
      const res = await fetch(
        "/api/komik?action=detail&id=" + encodeURIComponent(item.id)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setDetail({
        id: item.id,
        title: data.title || item.title,
        cover: item.cover || data.cover || null,
        chapters: (data.chapters || []).map((c: any, i: number) => ({
          id: String(c.id || c.url),
          title: c.title || "Chapter",
          url: String(c.url || c.id),
          index: i,
          paid: c.paid,
        })),
        colorLabel: data.colorLabel || item.colorLabel,
        statusLabel: data.statusLabel || item.statusLabel,
        note: data.note,
        external: data.external || item.external,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openRead = async (ch: Chapter, index: number) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(
        "/api/komik?action=read&chapterId=" + encodeURIComponent(ch.id)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      if (detail) {
        pushHist({
          comicId: detail.id,
          title: detail.title,
          chapterId: ch.id,
          chapterTitle: ch.title,
          cover: detail.cover,
        });
        setHist(loadHist());
      }
      setReader({
        title: ch.title || data.title,
        pages: data.pages || [],
        chapterId: ch.id,
        chapterIndex: index,
      });
      window.scrollTo({ top: 0 });
      setShowBar(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (reader) {
      setReader(null);
      return;
    }
    if (detail) {
      setDetail(null);
      return;
    }
  };

  const goChapter = (dir: -1 | 1) => {
    if (!detail || !reader) return;
    const n = reader.chapterIndex + dir;
    if (n < 0 || n >= detail.chapters.length) return;
    openRead(detail.chapters[n], n);
  };

  const typeOf = (item: Item) => {
    if (item.source === "omega" || item.source === "fullmanhwa") return "MANHWA";
    if (item.source === "mangadex") return "MANGA";
    return "KOMIK";
  };

  /* READER */
  if (reader) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#000", color: "#fff" }}
        onClick={() => setShowBar((v) => !v)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "rgba(9,9,11,0.95)",
            borderBottom: "1px solid #27272a",
            transform: showBar ? "none" : "translateY(-100%)",
            transition: "transform 0.2s",
          }}
        >
          <button
            type="button"
            onClick={goBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              padding: 8,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {reader.title}
            </div>
            <div style={{ fontSize: 10, color: "#71717a" }}>
              {reader.pages.length} halaman
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 0 72px" }}>
          {loading && (
            <p style={{ textAlign: "center", color: "#71717a", padding: 24 }}>
              Memuat...
            </p>
          )}
          {err && (
            <p style={{ textAlign: "center", color: "#fbbf24", padding: 24 }}>
              {err}
            </p>
          )}
          {reader.pages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              style={{ width: "100%", display: "block", background: "#18181b" }}
            />
          ))}
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            gap: 8,
            padding: 10,
            background: "rgba(9,9,11,0.95)",
            borderTop: "1px solid #27272a",
            transform: showBar ? "none" : "translateY(100%)",
            transition: "transform 0.2s",
          }}
        >
          <button
            type="button"
            disabled={reader.chapterIndex <= 0}
            onClick={() => goChapter(-1)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#27272a",
              color: "#fff",
              fontWeight: 700,
              opacity: reader.chapterIndex <= 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={
              !detail ||
              reader.chapterIndex >= (detail?.chapters.length || 1) - 1
            }
            onClick={() => goChapter(1)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 700,
              opacity:
                reader.chapterIndex >= (detail?.chapters.length || 1) - 1
                  ? 0.4
                  : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  /* DETAIL */
  if (detail) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #27272a",
          }}
        >
          <button
            type="button"
            onClick={goBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              fontSize: 13,
            }}
          >
            ← Kembali
          </button>
          <button
            type="button"
            onClick={() =>
              toggleFav({
                id: detail.id,
                title: detail.title,
                url: detail.id,
                cover: detail.cover,
              })
            }
            style={{
              background: isFav(detail.id) ? "#7c3aed" : "transparent",
              border: "1px solid #7c3aed",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {isFav(detail.id) ? "★ Favorit" : "☆ Favorit"}
          </button>
        </div>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {detail.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.cover}
                alt=""
                style={{
                  width: 96,
                  height: 128,
                  objectFit: "cover",
                  borderRadius: 12,
                  background: "#27272a",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 128,
                  borderRadius: 12,
                  background: "#27272a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📖
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {detail.title}
              </h1>
              <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>
                {detail.chapters.length} chapter
                {detail.statusLabel ? ` · ${detail.statusLabel}` : ""}
                {detail.colorLabel ? ` · ${detail.colorLabel}` : ""}
              </p>
              {detail.chapters[0] && (
                <button
                  type="button"
                  onClick={() => openRead(detail.chapters[0], 0)}
                  style={{
                    marginTop: 10,
                    background: "#7c3aed",
                    border: "none",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Mulai baca
                </button>
              )}
            </div>
          </div>
          {detail.note && (
            <p style={{ fontSize: 12, color: "#fbbf24", marginBottom: 12 }}>
              {detail.note}
            </p>
          )}
          {detail.external && (
            <a
              href={detail.external}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "#a78bfa" }}
            >
              Buka sumber →
            </a>
          )}
          {loading && (
            <p style={{ color: "#71717a", fontSize: 13 }}>Memuat...</p>
          )}
          {err && <p style={{ color: "#fbbf24", fontSize: 13 }}>{err}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {detail.chapters.map((c, idx) => {
              const read = loadHist().some((h) => h.chapterId === c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openRead(c, idx)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #27272a",
                    background: read ? "#18181b" : "#121214",
                    color: read ? "#71717a" : "#f4f4f5",
                    fontSize: 13,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {c.title}
                    {c.paid ? " 🔒" : ""}
                  </span>
                  <span style={{ fontSize: 11 }}>{read ? "Dibaca" : "Baca"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* CATALOG */
  const hero = (popular[0] || latest[0]) as Item | undefined;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(9,9,11,0.92)",
          borderBottom: "1px solid #27272a",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link href="/" style={{ color: "#a1a1aa", fontSize: 12, textDecoration: "none" }}>
            ← Home
          </Link>
          <strong style={{ fontSize: 15 }}>Baca Komik</strong>
          <button
            type="button"
            onClick={loadHome}
            style={{
              marginLeft: "auto",
              background: "#7c3aed",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: 12 }}>
        {hero && (
          <button
            type="button"
            onClick={() => openDetail(hero)}
            style={{
              width: "100%",
              border: "1px solid #27272a",
              borderRadius: 16,
              overflow: "hidden",
              background: "#18181b",
              color: "#fff",
              textAlign: "left",
              padding: 0,
              marginBottom: 14,
            }}
          >
            <div style={{ position: "relative", minHeight: 140 }}>
              {hero.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero.cover}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.35,
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  padding: 16,
                  background:
                    "linear-gradient(to top, #09090b, transparent)",
                }}
              >
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>
                  TRENDING
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                  {hero.title}
                </div>
              </div>
            </div>
          </button>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {(
            [
              ["all", "Semua"],
              ["omega", "Omega 18+"],
              ["fullmanhwa", "FullManhwa"],
              ["mangadex", "MangaDex"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSource(k)}
              style={{
                padding: "6px 10px",
                borderRadius: 20,
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                background: source === k ? "#7c3aed" : "#18181b",
                color: "#fff",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(
            [
              ["home", "Katalog"],
              ["fav", "Favorit"],
              ["hist", "Riwayat"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                background: tab === k ? "#7c3aed" : "#18181b",
                color: "#fff",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "home" && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(
                [
                  ["latest", "Terbaru"],
                  ["popular", "Terpopuler"],
                  ["rating", "Rating"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSort(k);
                    setSearchList(null);
                  }}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 8,
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    background: sort === k && !searchList ? "#fafafa" : "#18181b",
                    color: sort === k && !searchList ? "#09090b" : "#a1a1aa",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Cari judul..."
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #27272a",
                  background: "#18181b",
                  color: "#fff",
                }}
              />
              <button
                type="button"
                onClick={search}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#7c3aed",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Cari
              </button>
            </div>
          </>
        )}

        {tab === "hist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hist.length === 0 && (
              <p style={{ color: "#71717a", fontSize: 13 }}>Belum ada riwayat.</p>
            )}
            {hist.map((h) => (
              <div
                key={h.chapterId + h.at}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 8,
                  borderRadius: 12,
                  border: "1px solid #27272a",
                  background: "#18181b",
                }}
              >
                {h.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.cover}
                    alt=""
                    style={{
                      width: 40,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 56,
                      borderRadius: 6,
                      background: "#27272a",
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>
                    {h.chapterTitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab !== "hist" && (
          <>
            {loading && (
              <p style={{ color: "#71717a", fontSize: 13 }}>Memuat...</p>
            )}
            {err && !loading && (
              <p style={{ color: "#fbbf24", fontSize: 13 }}>{err}</p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {grid.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid #27272a",
                    background: "#18181b",
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(item);
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      zIndex: 2,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      border: "none",
                      background: "rgba(0,0,0,0.55)",
                      color: "#fff",
                    }}
                  >
                    {isFav(item.id) ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      padding: 0,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ position: "relative", aspectRatio: "3/4" }}>
                      {item.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover}
                          alt={item.title}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            background: "#27272a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                          }}
                        >
                          📖
                        </div>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          left: 6,
                          top: 6,
                          background:
                            typeOf(item) === "MANHWA" ? "#0284c7" : "#059669",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {typeOf(item)}
                      </span>
                    </div>
                    <div style={{ padding: 8 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          height: "2.6em",
                          overflow: "hidden",
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 10, color: "#71717a", marginTop: 4 }}>
                        {item.statusLabel || item.source || "Komik"}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
