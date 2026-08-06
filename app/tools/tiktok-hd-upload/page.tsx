"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  title: string;
  cover?: string | null;
  videoHd?: string | null;
  videoNormal?: string | null;
  downloadVideoHd?: string | null;
  downloadVideo?: string | null;
  author?: { name?: string; username?: string };
};

export default function TiktokHdUploadPage() {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const wrap = {
    background: "#0B0710",
    minHeight: "100vh",
    color: "#F3EEFA",
    fontFamily: "sans-serif",
    padding: 20,
  } as const;

  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1C1226",
    color: "#F3EEFA",
  } as const;

  const btn = (bg: string) =>
    ({
      width: "100%",
      padding: 12,
      borderRadius: 10,
      border: "none",
      background: bg,
      color: "#fff",
      fontWeight: 700,
      marginBottom: 8,
    }) as const;

  const fetchMeta = async () => {
    if (!url.trim()) {
      setStatus("Tempel link TikTok dulu.");
      return;
    }
    setLoading(true);
    setStatus("Mengambil video HD...");
    setResult(null);
    try {
      const res = await fetch("/api/downloader/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal ambil data");
      setResult(data);
      if (!caption && data.title) setCaption(String(data.title).slice(0, 150));
      setStatus(
        data.videoHd || data.downloadVideoHd
          ? "HD siap. Unduh atau lanjut upload."
          : "HD tidak tersedia; pakai kualitas biasa."
      );
    } catch (e: any) {
      setStatus(e.message || "Gagal");
    } finally {
      setLoading(false);
    }
  };

  const forceDownload = async (href: string, filename: string) => {
    setDownloading(true);
    setStatus("Mengunduh + merapikan nama file...");
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("Gagal unduh file");
      const blob = await res.blob();
      // "Perbaiki metadata" ringan: unduh ulang sebagai file baru dengan nama bersih
      const clean = new Blob([blob], { type: blob.type || "video/mp4" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(clean);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setStatus("Selesai diunduh: " + filename);
    } catch (e: any) {
      setStatus(e.message || "Gagal unduh");
    } finally {
      setDownloading(false);
    }
  };

  const hdHref =
    result?.downloadVideoHd ||
    (result?.videoHd
      ? "/api/downloader/tiktok/file?url=" +
        encodeURIComponent(result.videoHd) +
        "&filename=tiktok-hd-clean.mp4"
      : null);

  const normalHref =
    result?.downloadVideo ||
    (result?.videoNormal
      ? "/api/downloader/tiktok/file?url=" +
        encodeURIComponent(result.videoNormal) +
        "&filename=tiktok-nowm-clean.mp4"
      : null);

  const publicVideoUrl = result?.videoHd || result?.videoNormal || null;

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#9C90AC", fontSize: 13 }}>
          ← Kembali
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>
          📤 Upload TikTok HD
        </h1>
        <p style={{ fontSize: 13, color: "#9C90AC", marginBottom: 16 }}>
          Ambil video HD tanpa watermark, unduh dengan nama bersih, lalu upload
          lewat TikTok Studio.
        </p>

        <input
          style={inputStyle}
          placeholder="https://www.tiktok.com/@user/video/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          disabled={loading}
          onClick={fetchMeta}
          style={btn("#A855F7")}
        >
          {loading ? "Memproses..." : "Ambil Video HD"}
        </button>

        {status && (
          <p style={{ fontSize: 13, color: "#9C90AC", margin: "8px 0 12px" }}>
            {status}
          </p>
        )}

        {result && (
          <div
            style={{
              background: "#1C1226",
              borderRadius: 14,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {result.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.cover}
                  alt=""
                  style={{
                    width: 72,
                    height: 96,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {result.title}
                </div>
                <div style={{ fontSize: 12, color: "#C4B5FD", marginTop: 4 }}>
                  @{result.author?.username || result.author?.name || "-"}
                </div>
              </div>
            </div>

            <label style={{ fontSize: 12, color: "#9C90AC" }}>
              Caption (untuk upload)
            </label>
            <input
              style={inputStyle}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
            />

            {hdHref && (
              <button
                type="button"
                disabled={downloading}
                onClick={() =>
                  forceDownload(hdHref, "tiktok-hd-clean.mp4")
                }
                style={btn("linear-gradient(90deg,#7C3AED,#A855F7)")}
              >
                {downloading ? "Mengunduh..." : "Download HD (No WM) + nama bersih"}
              </button>
            )}

            {normalHref && (
              <button
                type="button"
                disabled={downloading}
                onClick={() =>
                  forceDownload(normalHref, "tiktok-nowm-clean.mp4")
                }
                style={btn("#374151")}
              >
                Download Biasa (No WM)
              </button>
            )}

            {publicVideoUrl && (
              <>
                <p style={{ fontSize: 11, color: "#6B6178", margin: "8px 0" }}>
                  Upload ke akun TikTok (butuh Hubungkan Akun di Studio). Video
                  harus URL publik — pakai link HD dari API:
                </p>
                <Link
                  href={
                    "/tiktok-studio?prefill=1"
                  }
                  style={{
                    ...btn("#0EA5E9"),
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        "tiktok_upload_prefill",
                        JSON.stringify({
                          videoUrl: publicVideoUrl,
                          title: caption || result.title || "",
                        })
                      );
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Lanjut ke TikTok Studio (Upload)
                </Link>
              </>
            )}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 11.5, color: "#6B6178", lineHeight: 1.6 }}>
          • HD &amp; no-watermark dari sumber publik (tikwm).
          <br />
          • “Metadata” di sini = unduh ulang sebagai file baru + nama bersih
          (bukan ffmpeg full strip).
          <br />
          • Upload resmi TikTok API sering <b>PRIVATE</b> sampai app diaudit.
        </p>
      </div>
    </div>
  );
}
