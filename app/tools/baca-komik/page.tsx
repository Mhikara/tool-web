"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = {
  id?: string;
  title: string;
  url: string;
  cover: string | null;
  colored?: boolean;
  colorLabel?: string;
  status?: string;
  statusLabel?: string;
};

type Chapter = {
  id?: string;
  title: string;
  url: string;
  number?: string;
  index?: number;
};

const HISTORY_KEY = "komik_read_history_v1";
const FAV_KEY = "komik_favorites_v1";

function loadHistory(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}
function markRead(chapterId: string) {
  const h = loadHistory();
  h[chapterId] = Date.now();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}
function isRead(chapterId: string, history: Record<string, number>) {
  return Boolean(history[chapterId]);
}
function loadFavorites(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveFavorites(list: Item[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

export default function BacaKomikPage() {
  const [q, setQ] = useState("");
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [genreId, setGenreId] = useState("");
  const [latest, setLatest] = useState<Item[]>([]);
  const [popular, setPopular] = useState<Item[]>([]);
  const [topRated, setTopRated] = useState<Item[]>([]);
  const [searchList, setSearchList] = useState<Item[] | null>(null);
  const [homeTab, setHomeTab] = useState<"latest" | "popular" | "rating">("latest");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"home" | "fav">("home");
  const [history, setHistory] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [detail, setDetail] = useState<{
    title: string;
    chapters: Chapter[];
    mangaId: string;
    cover?: string | null;
    colorLabel?: string;
    statusLabel?: string;
  } | null>(null);
  const [reader, setReader] = useState<{
    title: string;
    pages: string[];
    chapterId: string;
    chapterIndex: number;
  } | null>(null);

  const autoScrollRef = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoOn, setAutoOn] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setFavorites(loadFavorites());
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollRef.current = false;
    setAutoOn(false);
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    autoScrollRef.current = true;
    setAutoOn(true);
    scrollTimer.current = setInterval(() => {
      if (!autoScrollRef.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 4) {
        stopAutoScroll();
        return;
      }
      window.scrollBy({ top: 2.2, behavior: "auto" });
    }, 16);
  }, [stopAutoScroll]);

  const toggleAutoScroll = () => {
    if (autoScrollRef.current) stopAutoScroll();
    else startAutoScroll();
  };

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);
  useEffect(() => {
    if (!reader) stopAutoScroll();
  }, [reader, stopAutoScroll]);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setErr("");
    setSearchList(null);
    try {
      const res = await fetch("/api/komik?action=home");
      const data = await res.json();
      setLatest(data.latest || data.list || []);
      setPopular(data.popular || []);
      setTopRated(data.topRated || []);
      if (!(data.latest || data.list || []).length) {
        setErr(data.error || "Kosong");
      }
    } catch (e: any) {
      setErr(e.message || "Gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    fetch("/api/komik?action=genres")
      .then((r) => r.json())
      .then((d) => setGenres(d.genres || []))
      .catch(() => {});
  }, []);

  const goBack = () => {
    stopAutoScroll();
    if (reader) {
      setReader(null);
      return;
    }
    if (detail) {
      setDetail(null);
      return;
    }
  };

  const search = async (overrideGenre?: string) => {
    const g = overrideGenre !== undefined ? overrideGenre : genreId;
    if (!q.trim() && !g) {
      setSearchList(null);
      return loadHome();
    }
    setLoading(true);
    setErr("");
    setDetail(null);
    setReader(null);
    setTab("home");
    try {
      let api =
        "/api/komik?action=search&q=" + encodeURIComponent(q.trim());
      if (g) api += "&genre=" + encodeURIComponent(g);
      const res = await fetch(api);
      const data = await res.json();
      setSearchList(data.list || []);
      if (!data.list?.length) setErr("Tidak ketemu");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isFav = (id: string) =>
    favorites.some((f) => (f.id || f.url) === id);

  const toggleFav = (item: Item) => {
    const id = item.id || item.url;
    let next: Item[];
    if (isFav(id)) {
      next = favorites.filter((f) => (f.id || f.url) !== id);
    } else {
      next = [
        {
          id: item.id || item.url,
          title: item.title,
          url: item.url,
          cover: item.cover,
          colored: item.colored,
          colorLabel: item.colorLabel,
          statusLabel: item.statusLabel,
        },
        ...favorites.filter((f) => (f.id || f.url) !== id),
      ];
    }
    setFavorites(next);
    saveFavorites(next);
  };

  const openDetail = async (item: Item) => {
    const mangaId = item.id || item.url;
    setLoading(true);
    setErr("");
    setReader(null);
    try {
      const res = await fetch(
        "/api/komik?action=detail&id=" + encodeURIComponent(mangaId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setDetail({
        title: data.title,
        chapters: data.chapters || [],
        mangaId,
        cover: item.cover || data.cover || null,
        colorLabel: data.colorLabel || item.colorLabel,
        statusLabel: data.statusLabel || item.statusLabel,
      });
      setHistory(loadHistory());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openRead = async (ch: Chapter, index?: number) => {
    const chapterId = ch.id || ch.url;
    const idx = index ?? ch.index ?? 0;
    setLoading(true);
    setErr("");
    stopAutoScroll();
    try {
      const res = await fetch(
        "/api/komik?action=read&chapterId=" + encodeURIComponent(chapterId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      markRead(chapterId);
      setHistory(loadHistory());
      setReader({
        title: ch.title || data.title,
        pages: data.pages || [],
        chapterId,
        chapterIndex: idx,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goChapter = (dir: -1 | 1) => {
    if (!detail || !reader) return;
    const next = reader.chapterIndex + dir;
    if (next < 0 || next >= detail.chapters.length) return;
    openRead(detail.chapters[next], next);
  };

  const displayList =
    tab === "fav"
      ? favorites
      : searchList
        ? searchList
        : homeTab === "popular"
          ? popular
          : homeTab === "rating"
            ? topRated
            : latest;

  const card = (item: Item) => {
    const id = item.id || item.url;
    const fav = isFav(id);
    return (
      <div
        key={id}
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#16101c",
          overflow: "hidden",
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
            width: 32,
            height: 32,
            borderRadius: 16,
            border: "none",
            background: "rgba(0,0,0,0.55)",
            fontSize: 16,
          }}
        >
          {fav ? "⭐" : "☆"}
        </button>
        <button
          type="button"
          onClick={() => openDetail(item)}
          style={{
            textAlign: "left",
            padding: 0,
            border: "none",
            background: "transparent",
            color: "#F3EEFA",
            width: "100%",
          }}
        >
          {item.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover}
              alt={item.title}
              style={{
                width: "100%",
                aspectRatio: "3/4",
                objectFit: "cover",
                display: "block",
                background: "#2a1f35",
              }}
            />
          ) : (
            <div
              style={{
                aspectRatio: "3/4",
                background: "#2a1f35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              📖
            </div>
          )}
          <div style={{ padding: "8px 10px 10px" }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.title}
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: item.colored
                    ? "rgba(34,197,94,0.2)"
                    : "rgba(148,163,184,0.2)",
                  color: item.colored ? "#86EFAC" : "#94A3B8",
                }}
              >
                {item.colorLabel ||
                  (item.colored ? "Bergambar" : "Tidak bergambar")}
              </span>
              {item.statusLabel && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: "rgba(168,85,247,0.2)",
                    color: "#D8B4FE",
                  }}
                >
                  {item.statusLabel}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#0B0710",
        minHeight: "100vh",
        color: "#F3EEFA",
        fontFamily: "sans-serif",
        padding: 16,
        paddingBottom: 48,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ color: "#9C90AC", fontSize: 13 }}>
            ← Beranda
          </Link>
          {(reader || detail) && (
            <button
              type="button"
              onClick={goBack}
              style={{
                background: "#A855F7",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Kembali
            </button>
          )}
          {!reader && !detail && (
            <button
              type="button"
              onClick={loadHome}
              style={{
                background: "#A855F7",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Refresh
            </button>
          )}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          📖 Baca Komik
        </h1>
        <p style={{ fontSize: 12, color: "#9C90AC", marginBottom: 10 }}>
          Chapter lengkap · Terbaru · Terpopuler · Rating
        </p>

        {!detail && !reader && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setTab("home")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  background: tab === "home" ? "#A855F7" : "#1C1226",
                  color: "#fff",
                }}
              >
                Jelajah
              </button>
              <button
                type="button"
                onClick={() => setTab("fav")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  background: tab === "fav" ? "#A855F7" : "#1C1226",
                  color: "#fff",
                }}
              >
                ⭐ Favorit ({favorites.length})
              </button>
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
                        setHomeTab(k);
                        setSearchList(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 4px",
                        borderRadius: 8,
                        border: "none",
                        fontWeight: 700,
                        fontSize: 12,
                        background:
                          homeTab === k && !searchList ? "#7C3AED" : "#1C1226",
                        color: "#fff",
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
                      border: "1px solid #333",
                      background: "#1C1226",
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
                      background: "#A855F7",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    Cari
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#9C90AC", marginBottom: 6 }}>
                    Genre
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      maxHeight: 120,
                      overflowY: "auto",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGenreId("");
                        setSearchList(null);
                        loadHome();
                      }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 16,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        background: !genreId ? "#A855F7" : "#1C1226",
                        color: "#fff",
                      }}
                    >
                      Semua
                    </button>
                    {genres.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGenreId(g.id);
                          search(g.id);
                        }}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 16,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 600,
                          background: genreId === g.id ? "#7C3AED" : "#1C1226",
                          color: "#fff",
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

              </>
            )}
          </>
        )}

        {loading && (
          <p style={{ fontSize: 13, color: "#9C90AC" }}>Memuat...</p>
        )}
        {err && !loading && !reader && (
          <p style={{ fontSize: 13, color: "#FBBF24" }}>{err}</p>
        )}

        {reader && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, flex: 1 }}>
                {reader.title}
              </h2>
              <button
                type="button"
                onClick={toggleAutoScroll}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: autoOn ? "#22c55e" : "#374151",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {autoOn ? "⏸ Stop" : "▶ Auto"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9C90AC", marginBottom: 8 }}>
              {reader.pages.length} halaman · ketuk gambar = auto scroll
            </p>
            <div
              style={{ display: "flex", gap: 8, marginBottom: 12 }}
            >
              <button
                type="button"
                disabled={!detail || reader.chapterIndex <= 0}
                onClick={() => goChapter(-1)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#1C1226",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  opacity: reader.chapterIndex <= 0 ? 0.4 : 1,
                }}
              >
                ← Chapter sebelumnya
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
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#1C1226",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  opacity:
                    reader.chapterIndex >= (detail?.chapters.length || 1) - 1
                      ? 0.4
                      : 1,
                }}
              >
                Chapter berikutnya →
              </button>
            </div>
            <div onClick={toggleAutoScroll} style={{ cursor: "pointer" }}>
              {reader.pages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={"Hal " + (i + 1)}
                  loading="lazy"
                  draggable={false}
                  style={{
                    width: "100%",
                    display: "block",
                    background: "#111",
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                disabled={!detail || reader.chapterIndex <= 0}
                onClick={() => goChapter(-1)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: "none",
                  background: "#A855F7",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
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
                  borderRadius: 8,
                  border: "none",
                  background: "#A855F7",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
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
        )}

        {!reader && detail && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {detail.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.cover}
                  alt=""
                  style={{
                    width: 90,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#2a1f35",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 90,
                    height: 120,
                    borderRadius: 8,
                    background: "#2a1f35",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  📖
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{detail.title}</h2>
                <p style={{ fontSize: 12, color: "#9C90AC", marginTop: 4 }}>
                  {detail.chapters.length} chapter (lengkap)
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}
                >
                  {detail.colorLabel && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(148,163,184,0.2)",
                        color: "#94A3B8",
                      }}
                    >
                      {detail.colorLabel}
                    </span>
                  )}
                  {detail.statusLabel && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(168,85,247,0.2)",
                        color: "#D8B4FE",
                      }}
                    >
                      {detail.statusLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleFav({
                      id: detail.mangaId,
                      title: detail.title,
                      url: detail.mangaId,
                      cover: detail.cover || null,
                    })
                  }
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #A855F7",
                    background: isFav(detail.mangaId)
                      ? "rgba(168,85,247,0.25)"
                      : "transparent",
                    color: "#E9D5FF",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isFav(detail.mangaId) ? "⭐ Favorit" : "☆ Favorit"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.chapters.map((c, idx) => {
                const cid = c.id || c.url;
                const read = isRead(cid, history);
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => openRead(c, idx)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: read
                        ? "1px solid #3f3f46"
                        : "1px solid rgba(168,85,247,0.35)",
                      background: read ? "#18181b" : "#1C1226",
                      color: read ? "#71717a" : "#E9D5FF",
                      fontSize: 13,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{c.title}</span>
                    <span style={{ fontSize: 11 }}>
                      {read ? "Dibaca" : "Baca"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!detail && !reader && (
          <>
            {tab === "fav" && favorites.length === 0 && (
              <p style={{ fontSize: 13, color: "#9C90AC" }}>
                Belum ada favorit. Ketuk ☆ di cover.
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {displayList.map((item) => card(item))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
