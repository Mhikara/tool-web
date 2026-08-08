"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { title: string; url: string; cover: string | null };
type Chapter = { title: string; url: string };

export default function BacaKomikPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [detail, setDetail] = useState<{
    title: string;
    chapters: Chapter[];
    cover: string | null;
  } | null>(null);
  const [reader, setReader] = useState<{
    title: string;
    pages: string[];
  } | null>(null);

  const loadHome = async () => {
    setLoading(true);
    setErr("");
    setDetail(null);
    setReader(null);
    try {
      const res = await fetch("/api/komik?action=home");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setList(data.list || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

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
      if (!res.ok) throw new Error(data.error || "Gagal");
      setList(data.list || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (url: string) => {
    setLoading(true);
    setErr("");
    setReader(null);
    try {
      const res = await fetch(
        "/api/komik?action=detail&url=" + encodeURIComponent(url)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setDetail({
        title: data.title,
        chapters: data.chapters || [],
        cover: data.cover,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openRead = async (url: string) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(
        "/api/komik?action=read&url=" + encodeURIComponent(url)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setReader({ title: data.title, pages: data.pages || [] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const wrap = {
    background: "#0B0710",
    minHeight: "100vh",
    color: "#F3EEFA",
    fontFamily: "sans-serif",
    padding: 16,
  } as const;

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Link href="/" style={{ color: "#9C90AC", fontSize: 13 }}>
            ← Beranda
          </Link>
          {(detail || reader) && (
            <button
              type="button"
              onClick={() => {
                if (reader) setReader(null);
                else {
                  setDetail(null);
                  loadHome();
                }
              }}
              style={{
                background: "transparent",
                border: "1px solid #444",
                color: "#C4B5FD",
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
              }}
            >
              Kembali
            </button>
          )}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          📖 Baca Komik
        </h1>
        <p style={{ fontSize: 12, color: "#9C90AC", marginBottom: 12 }}>
          Sumber ManhwaDesu · tampilan tanpa iklan di app ini
        </p>

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
        {err && (
          <p style={{ fontSize: 13, color: "#F87171", marginBottom: 10 }}>
            {err}
          </p>
        )}

        {/* READER — hanya gambar chapter */}
        {reader && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              {reader.title}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {reader.pages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`hal ${i + 1}`}
                  loading="lazy"
                  style={{ width: "100%", display: "block", background: "#111" }}
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        )}

        {/* DETAIL + chapter list */}
        {!reader && detail && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{detail.title}</h2>
            {detail.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.cover}
                alt=""
                style={{
                  width: 120,
                  borderRadius: 8,
                  margin: "10px 0",
                }}
                referrerPolicy="no-referrer"
              />
            )}
            <p style={{ fontSize: 12, color: "#9C90AC", marginBottom: 8 }}>
              {detail.chapters.length} chapter
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.chapters.map((c) => (
                <button
                  key={c.url}
                  type="button"
                  onClick={() => openRead(c.url)}
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

        {/* LIST */}
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
                onClick={() => openDetail(item.url)}
                style={{
                  textAlign: "left",
                  padding: 0,
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#1C1226",
                  color: "#F3EEFA",
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
                    referrerPolicy="no-referrer"
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

        <p style={{ marginTop: 24, fontSize: 11, color: "#6B6178" }}>
          Konten dari ManhwaDesu. Hanya menampilkan gambar chapter — iklan situs
          tidak dimuat di UI ini.
        </p>
      </div>
    </div>
  );
}
