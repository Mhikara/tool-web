"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id?: string;
  title: string;
  url: string;
  cover: string | null;
};

type Chapter = {
  id?: string;
  title: string;
  url: string;
};

const HISTORY_KEY = "komik_read_history_v1";

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

export default function BacaKomikPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<{
    title: string;
    chapters: Chapter[];
    mangaId: string;
    cover?: string | null;
  } | null>(null);
  const [reader, setReader] = useState<{
    title: string;
    pages: string[];
    chapterId: string;
  } | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setErr("");
    setDetail(null);
    setReader(null);
    try {
      const res = await fetch("/api/komik?action=home");
      const data = await res.json();
      setList(data.list || []);
      setNote(data.note || data.source || "");
      if (!data.list?.length) setErr(data.error || "Kosong");
    } catch (e: any) {
      setErr(e.message || "Gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const search = async () => {
    if (!q.trim()) return loadHome();
    setLoading(true);
    setErr("");
    setDetail(null);
    setReader(null);
    try {
      const res = await fetch(
        "/api/komik?action=search&q=" + encodeURIComponent(q.trim())
      );
      const data = await res.json();
      setList(data.list || []);
      if (!data.list?.length) setErr("Tidak ketemu");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
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
        cover: item.cover,
      });
      setHistory(loadHistory());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openRead = async (ch: Chapter) => {
    const chapterId = ch.id || ch.url;
    setLoading(true);
    setErr("");
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
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory({});
  };

  return (
    <div
      style={{
        background: "#0B0710",
        minHeight: "100vh",
        color: "#F3EEFA",
        fontFamily: "sans-serif",
        padding: 16,
        paddingBottom: 40,
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
          <div style={{ display: "flex", gap: 6 }}>
            {Object.keys(history).length > 0 && !reader && (
              <button
                type="button"
                onClick={clearHistory}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "#9C90AC",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 11,
                }}
              >
                Hapus riwayat
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (reader) setReader(null);
                else if (detail) {
                  setDetail(null);
                  loadHome();
                } else loadHome();
              }}
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
              {reader || detail ? "Kembali" : "Refresh"}
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          📖 Baca Komik
        </h1>
        <p style={{ fontSize: 12, color: "#9C90AC", marginBottom: 8 }}>
          List judul · riwayat chapter tersimpan di HP ini
        </p>
        {note && (
          <p style={{ fontSize: 11, color: "#A78BFA", marginBottom: 12 }}>
            {note}
          </p>
        )}

        {!detail && !reader && (
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
        )}

        {loading && (
          <p style={{ fontSize: 13, color: "#9C90AC" }}>Memuat...</p>
        )}
        {err && !loading && (
          <p style={{ fontSize: 13, color: "#FBBF24" }}>{err}</p>
        )}

        {/* READER */}
        {reader && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {reader.title}
            </h2>
            <p style={{ fontSize: 11, color: "#86EFAC", marginBottom: 12 }}>
              ✓ Chapter ditandai sudah dibaca
            </p>
            {reader.pages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                style={{ width: "100%", display: "block", background: "#111" }}
              />
            ))}
          </div>
        )}

        {/* DETAIL + chapter list (warna ganti jika sudah dibaca) */}
        {!reader && detail && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {detail.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.cover}
                  alt=""
                  style={{
                    width: 90,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{detail.title}</h2>
                <p style={{ fontSize: 12, color: "#9C90AC", marginTop: 4 }}>
                  {detail.chapters.length} chapter
                </p>
                <p style={{ fontSize: 11, color: "#6B6178", marginTop: 6 }}>
                  Abu-abu = sudah dibaca · Ungu = belum
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.chapters.map((c) => {
                const cid = c.id || c.url;
                const read = isRead(cid, history);
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => openRead(c)}
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
                      alignItems: "center",
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

        {/* LIST seperti grid manhwadesu: cover + judul */}
        {!detail && !reader && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {list.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => openDetail(item)}
                style={{
                  textAlign: "left",
                  padding: 0,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#16101c",
                  color: "#F3EEFA",
                  overflow: "hidden",
                }}
              >
                {item.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "3/4",
                      objectFit: "cover",
                      display: "block",
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
                    style={{
                      fontSize: 11,
                      color: "#A78BFA",
                      marginTop: 4,
                    }}
                  >
                    Lihat chapter →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
