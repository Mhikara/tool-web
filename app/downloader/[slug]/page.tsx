"use client";
import { useState, use } from "react";
import { getDownloaderBySlug } from "@/lib/downloaderTools";
import { notFound } from "next/navigation";

export default function DownloaderDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tool = getDownloaderBySlug(slug);
  if (!tool) return notFound();

  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  const wrap = { background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 };
  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1C1226",
    color: "#F3EEFA",
  } as const;
  const btnStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#A855F7",
    color: "#fff",
    fontWeight: 700,
  } as const;

  // ---- YOUTUBE ----
  const handleYoutube = async (format: "mp4" | "mp3") => {
    setLoading(true);
    setStatus("Memproses...");
    try {
      const res = await fetch("/api/downloader/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input, format }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `video.${format}`;
      link.click();
      setStatus("Selesai diunduh.");
    } catch (e: any) {
      setStatus(e.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  // ---- TIKTOK ----
  const handleTiktok = async () => {
    setLoading(true);
    setStatus("Memproses...");
    setResult(null);
    try {
      const res = await fetch("/api/downloader/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus("");
    } catch (e: any) {
      setStatus(e.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  // ---- INSTAGRAM ----
  const handleInstagram = async () => {
    setLoading(true);
    setStatus("Memproses...");
    setResult(null);
    try {
      const res = await fetch("/api/downloader/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus("");
    } catch (e: any) {
      setStatus(e.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  // ---- SPOTIFY (search) ----
  const handleSpotifySearch = async () => {
    setLoading(true);
    setStatus("Mencari...");
    setTracks([]);
    try {
      const res = await fetch("/api/downloader/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTracks(data.tracks || []);
      setStatus(data.tracks?.length ? "" : "Tidak ada hasil.");
    } catch (e: any) {
      setStatus(e.message || "Gagal mencari.");
    } finally {
      setLoading(false);
    }
  };

  // ---- TERABOX ----
  const handleTerabox = async () => {
    setLoading(true);
    setStatus("Memproses...");
    try {
      const res = await fetch("/api/downloader/terabox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "terabox-file";
      link.click();
      setStatus("Selesai diunduh.");
    } catch (e: any) {
      setStatus(e.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {tool.icon} {tool.title}
        </h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>{tool.description}</p>

        {/* INPUT */}
        <input
          type="text"
          placeholder={
            slug === "spotify" ? "Cari judul lagu atau artis..." : `Paste link ${tool.title} di sini...`
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={inputStyle}
        />

        {/* ACTION BUTTONS PER PLATFORM */}
        {slug === "youtube" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={loading} onClick={() => handleYoutube("mp4")} style={btnStyle}>
              Download MP4
            </button>
            <button disabled={loading} onClick={() => handleYoutube("mp3")} style={{ ...btnStyle, background: "#EC4899" }}>
              Download MP3
            </button>
          </div>
        )}

        {slug === "tiktok" && (
          <button disabled={loading} onClick={handleTiktok} style={btnStyle}>
            Ambil Video
          </button>
        )}

        {slug === "instagram" && (
          <button disabled={loading} onClick={handleInstagram} style={btnStyle}>
            Ambil Media
          </button>
        )}

        {slug === "spotify" && (
          <button disabled={loading} onClick={handleSpotifySearch} style={btnStyle}>
            Cari Lagu
          </button>
        )}

        {slug === "terabox" && (
          <button disabled={loading} onClick={handleTerabox} style={btnStyle}>
            Download
          </button>
        )}

        {status && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{status}</p>}

        {/* RESULT: TikTok / Instagram */}
        {result && (slug === "tiktok" || slug === "instagram") && (
          <div style={{ marginTop: 20, background: "#1C1226", borderRadius: 12, padding: 16 }}>
            {(result.cover || result.imageUrl) && (
              <img
                src={result.cover || result.imageUrl}
                alt="preview"
                style={{ width: "100%", borderRadius: 8, marginBottom: 12 }}
              />
            )}
            {result.videoUrl && (
              <a href={result.videoUrl} download target="_blank" rel="noreferrer" style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none", marginBottom: 8 }}>
                Download Video
              </a>
            )}
            {result.audioUrl && (
              <a href={result.audioUrl} download target="_blank" rel="noreferrer" style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none", background: "#EC4899" }}>
                Download Audio
              </a>
            )}
            {result.imageUrl && !result.videoUrl && (
              <a href={result.imageUrl} download target="_blank" rel="noreferrer" style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>
                Download Foto
              </a>
            )}
          </div>
        )}

        {/* RESULT: Spotify tracks */}
        {tracks.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {tracks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, background: "#1C1226", borderRadius: 12, padding: 12, alignItems: "center" }}>
                {t.cover && <img src={t.cover} alt="" style={{ width: 48, height: 48, borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#9C90AC" }}>{t.artist}</div>
                  {t.previewUrl ? (
                    <audio controls src={t.previewUrl} style={{ width: "100%", marginTop: 6, height: 32 }} />
                  ) : (
                    <div style={{ fontSize: 10, color: "#6B6178", marginTop: 4 }}>Preview tidak tersedia</div>
                  )}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#6B6178", marginTop: 4 }}>
              *Ini adalah preview resmi 30 detik dari Spotify. Download full-track MP3 tidak didukung
              karena melanggar hak cipta/DRM.
            </p>
          </div>
        )}

        <p style={{ marginTop: 24, fontSize: 11.5, color: "#6B6178", lineHeight: 1.6 }}>
          {slug === "instagram" && "Catatan: hanya bekerja untuk post publik (bukan carousel/akun private)."}
          {slug === "terabox" && "Catatan: hanya bekerja jika link mengarah langsung ke file, bukan halaman share biasa."}
        </p>
      </div>
    </div>
  );
}
