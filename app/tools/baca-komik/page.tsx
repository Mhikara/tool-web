"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Item = { id?: string; title: string; url: string; cover: string | null };
type Chapter = { id?: string; title: string; url: string };

export default function BacaKomikPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState<{
    title: string;
    chapters: Chapter[];
    mangaId: string;
  } | null>(null);
  const [reader, setReader] = useState<{
    title: string;
    pages: string[];
  } | null>(null);

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
      });
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
      setReader({ title: ch.title || data.title, pages: data.pages || [] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#0B0710",
        minHeight: "100vh",
        color: "#F3EEFA",
        fontFamily: "sans-serif",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Link href="/" style={{ color: "#9C90AC", fontSize: 13 }}>
            ← Beranda
          </Link>
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

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          📖 Baca Komik
        </h1>
        <p style={{ fontSize: 12, color: "#9C90AC", marginBottom: 8 }}>
          Sumber aktif: MangaDex (Bahasa Indonesia) · tanpa iklan
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

        {reader && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              {reader.title}
            </h2>
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

        {!reader && detail && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
              {detail.title}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.chapters.map((c) => (
                <button
                  key={c.url}
                  type="button"
                  onClick={() => openRead(c)}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #333",
                    background: "#1C1226",
                    color: "#F3EEFA",
                    fontSize: 13,
                  }}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {!detail && !reader && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
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
                  background: "#1C1226",
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
                    }}
                  >
                    📖
                  </div>
                )}
                <div
                  style={{
                    padding: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
