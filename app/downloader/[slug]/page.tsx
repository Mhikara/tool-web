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
  const [spotifyUnavailable, setSpotifyUnavailable] = useState(false);
  const [tiktokMode, setTiktokMode] = useState<"link" | "search">("link");
  const [tiktokResults, setTiktokResults] = useState<any[]>([]);
  const [ytInfo, setYtInfo] = useState<any>(null);

  const wrap = { background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 };
  const inputStyle = {
    width: "100%", padding: 12, marginBottom: 12, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", background: "#1C1226", color: "#F3EEFA",
  } as const;
  const btnStyle = {
    width: "100%", padding: 12, borderRadius: 10, border: "none",
    background: "#A855F7", color: "#fff", fontWeight: 700,
  } as const;
  const tabBtn = (active: boolean) => ({
    flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: active ? "#A855F7" : "transparent", color: active ? "#fff" : "#9C90AC",
    fontWeight: 600, fontSize: 13,
  } as const);

  const handleYoutubeInfo = async () => {
    if (!input.trim()) { setStatus("Tempel URL YouTube dulu."); return; }
    setLoading(true); setStatus("Mengambil info..."); setYtInfo(null);
    try {
      const res = await fetch("/api/downloader/youtube", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input, action: "info" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setYtInfo(data); setStatus("");
    } catch (e: any) { setStatus(e.message || "Gagal mengambil info."); }
    finally { setLoading(false); }
  };

  const handleYoutubeDownload = async (format: "mp4" | "mp3", itag?: number) => {
    setLoading(true); setStatus("Mengunduh...");
    try {
      const res = await fetch("/api/downloader/youtube", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input, action: "download", format, itag }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "youtube." + format;
      a.click();
      setStatus("Selesai diunduh.");
    } catch (e: any) { setStatus(e.message || "Gagal mengunduh."); }
    finally { setLoading(false); }
  };

  const handleTiktok = async () => {
    if (!input.trim()) { setStatus("Tempel link TikTok dulu."); return; }
    setLoading(true); setStatus("Mengambil data..."); setResult(null);
    try {
      const res = await fetch("/api/downloader/tiktok", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setResult(data); setStatus("");
    } catch (e: any) { setStatus(e.message || "Gagal memproses."); }
    finally { setLoading(false); }
  };

  const handleTiktokSearch = async () => {
    setLoading(true); setStatus("Mencari..."); setTiktokResults([]);
    try {
      const res = await fetch("/api/downloader/tiktok-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setTiktokResults(data.results || []);
      setStatus((data.results && data.results.length) ? "" : "Tidak ada hasil.");
    } catch (e: any) { setStatus(e.message || "Gagal mencari."); }
    finally { setLoading(false); }
  };

  const handleInstagram = async () => {
    setLoading(true); setStatus("Memproses..."); setResult(null);
    try {
      const res = await fetch("/api/downloader/instagram", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setResult(data); setStatus("");
    } catch (e: any) { setStatus(e.message || "Gagal memproses."); }
    finally { setLoading(false); }
  };

  const handleSpotifySearch = async () => {
    setLoading(true); setStatus("Mencari..."); setTracks([]); setSpotifyUnavailable(false);
    try {
      const res = await fetch("/api/downloader/spotify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      if (data.unavailable) { setSpotifyUnavailable(true); setStatus(""); return; }
      if (!res.ok) throw new Error(data.error || "Gagal");
      setTracks(data.tracks || []);
      setStatus((data.tracks && data.tracks.length) ? "" : "Tidak ada hasil.");
    } catch (e: any) { setStatus(e.message || "Gagal mencari."); }
    finally { setLoading(false); }
  };

  const handleTerabox = async () => {
    setLoading(true); setStatus("Memproses...");
    try {
      const res = await fetch("/api/downloader/terabox", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal");
      }
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
          setStatus("Link download dibuka.");
        } else {
          setStatus(data.error || "Selesai.");
        }
      } else {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "terabox-file";
        a.click();
        setStatus("Selesai diunduh.");
      }
    } catch (e: any) { setStatus(e.message || "Gagal memproses."); }
    finally { setLoading(false); }
  };

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return m + ":" + s;
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{tool.icon} {tool.title}</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>{tool.description}</p>

        {slug === "tiktok" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button type="button" onClick={() => { setTiktokMode("link"); setInput(""); setTiktokResults([]); setResult(null); setStatus(""); }} style={tabBtn(tiktokMode === "link")}>Paste Link</button>
            <button type="button" onClick={() => { setTiktokMode("search"); setInput(""); setResult(null); setStatus(""); }} style={tabBtn(tiktokMode === "search")}>Cari Judul</button>
          </div>
        )}

        <input
          type="text"
          placeholder={
            slug === "spotify" ? "Cari judul lagu atau artis..." :
            slug === "tiktok" && tiktokMode === "search" ? "Cari video TikTok..." :
            slug === "youtube" ? "Tempel URL YouTube..." :
            "Paste link di sini..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={inputStyle}
        />

        {slug === "youtube" && (
          <>
            <button type="button" disabled={loading} onClick={handleYoutubeInfo} style={{ ...btnStyle, background: "linear-gradient(90deg,#ef4444,#f43f5e)", marginBottom: 12 }}>
              {loading ? "Memproses..." : "Ambil Info"}
            </button>
            {ytInfo && (
              <div style={{ marginTop: 8, background: "#1C1226", borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  {ytInfo.thumbnail && <img src={ytInfo.thumbnail} alt="" style={{ width: 120, height: 68, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 4 }}>{ytInfo.title}</div>
                    <div style={{ fontSize: 11, color: "#9C90AC" }}>
                      {ytInfo.channel}{ytInfo.duration ? " · " + fmtDuration(ytInfo.duration) : ""}
                    </div>
                  </div>
                </div>
                {ytInfo.videoFormats && ytInfo.videoFormats.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 8 }}>VIDEO MP4</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ytInfo.videoFormats.map((f: any) => (
                        <button key={f.itag} type="button" disabled={loading} onClick={() => handleYoutubeDownload("mp4", f.itag)}
                          style={{ ...btnStyle, background: "#374151", padding: "10px 14px", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                          <span>{f.quality}{f.hasAudio ? "" : " (tanpa audio)"}{f.fps ? " · " + f.fps + "fps" : ""}</span>
                          <span style={{ fontSize: 11, opacity: 0.7 }}>{f.size || "Download"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#F472B6", marginBottom: 8 }}>AUDIO MP3</div>
                  <button type="button" disabled={loading} onClick={() => handleYoutubeDownload("mp3")} style={{ ...btnStyle, background: "#EC4899", padding: "10px 14px", fontSize: 13 }}>
                    Download Audio (MP3)
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {slug === "tiktok" && tiktokMode === "link" && (
          <button type="button" disabled={loading} onClick={handleTiktok} style={btnStyle}>{loading ? "Memproses..." : "Ambil Video"}</button>
        )}
        {slug === "tiktok" && tiktokMode === "search" && (
          <button type="button" disabled={loading} onClick={handleTiktokSearch} style={btnStyle}>{loading ? "Mencari..." : "Cari Video"}</button>
        )}
        {slug === "instagram" && <button type="button" disabled={loading} onClick={handleInstagram} style={btnStyle}>Ambil Media</button>}
        {slug === "spotify" && <button type="button" disabled={loading} onClick={handleSpotifySearch} style={btnStyle}>Cari Lagu</button>}
        {slug === "terabox" && <button type="button" disabled={loading} onClick={handleTerabox} style={btnStyle}>Download</button>}

        {status && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{status}</p>}

        {spotifyUnavailable && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, fontSize: 13, color: "#C4B5FD" }}>
            Fitur Spotify belum aktif. Tambah SPOTIFY_CLIENT_ID & SECRET di Vercel Env.
          </div>
        )}

        {result && slug === "tiktok" && (
          <div style={{ marginTop: 20, background: "#1C1226", borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {result.cover && <img src={result.cover} alt="" style={{ width: 90, height: 120, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>{result.title}</div>
                <div style={{ fontSize: 12, color: "#C4B5FD", marginBottom: 4 }}>@{result.author?.username || result.author?.name || "-"}</div>
                {result.duration != null && <div style={{ fontSize: 11, color: "#9C90AC" }}>Durasi: {result.duration}s</div>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(result.downloadVideo || result.videoUrl) && (
                <a href={result.downloadVideo || ("/api/downloader/tiktok/file?url=" + encodeURIComponent(result.videoUrl) + "&filename=tiktok-video.mp4")}
                  style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>Download Video (No WM)</a>
              )}
              {(result.downloadAudio || result.audioUrl) && (
                <a href={result.downloadAudio || ("/api/downloader/tiktok/file?url=" + encodeURIComponent(result.audioUrl) + "&filename=tiktok-audio.mp3")}
                  style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none", background: "#EC4899" }}>Download Audio (MP3)</a>
              )}
            </div>
            {result.images && result.images.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 8 }}>FOTO ({result.images.length})</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.images.map((img: string, i: number) => (
                    <a key={i} href={"/api/downloader/tiktok/file?url=" + encodeURIComponent(img) + "&filename=tiktok-foto-" + (i + 1) + ".jpg"}>
                      <img src={img} alt="" style={{ width: "100%", borderRadius: 8, aspectRatio: "1", objectFit: "cover" }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result && slug === "instagram" && (
          <div style={{ marginTop: 20, background: "#1C1226", borderRadius: 12, padding: 16 }}>
            {(result.cover || result.imageUrl) && (
              <img src={result.cover || result.imageUrl} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
            )}
            {(result.downloadVideo || result.videoUrl) && (
              <a href={result.downloadVideo || result.videoUrl} style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none", marginBottom: 8 }}>Download Video</a>
            )}
            {(result.downloadImage || (result.imageUrl && !result.videoUrl)) && (
              <a href={result.downloadImage || result.imageUrl} style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>Download Foto</a>
            )}
          </div>
        )}

        {tiktokResults.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {tiktokResults.map((v, i) => (
              <div key={i} style={{ background: "#1C1226", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {v.cover && <img src={v.cover} alt="" style={{ width: 60, height: 80, borderRadius: 8, objectFit: "cover" }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{v.title || "(tanpa judul)"}</div>
                    <div style={{ fontSize: 11, color: "#9C90AC", marginTop: 4 }}>{v.author}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {v.videoUrl && (
                    <a href={"/api/downloader/tiktok/file?url=" + encodeURIComponent(v.videoUrl) + "&filename=tiktok-" + (i + 1) + ".mp4"}
                      style={{ ...btnStyle, flex: 1, textAlign: "center", textDecoration: "none", padding: 8, fontSize: 12 }}>Video</a>
                  )}
                  {v.audioUrl && (
                    <a href={"/api/downloader/tiktok/file?url=" + encodeURIComponent(v.audioUrl) + "&filename=tiktok-audio-" + (i + 1) + ".mp3"}
                      style={{ ...btnStyle, flex: 1, textAlign: "center", textDecoration: "none", padding: 8, fontSize: 12, background: "#EC4899" }}>Audio</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tracks.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {tracks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, background: "#1C1226", borderRadius: 12, padding: 12, alignItems: "center" }}>
                {t.cover && <img src={t.cover} alt="" style={{ width: 48, height: 48, borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#9C90AC" }}>{t.artist}</div>
                  {t.previewUrl && <audio controls src={t.previewUrl} style={{ width: "100%", marginTop: 6, height: 32 }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
