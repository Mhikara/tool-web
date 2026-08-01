"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TiktokStudio() {
  const params = useSearchParams();
  const connected = params.get("connected") === "1";

  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", padding: 12, marginBottom: 12, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", background: "#1C1226", color: "#F3EEFA",
  } as const;
  const btnStyle = {
    width: "100%", padding: 12, borderRadius: 10, border: "none",
    background: "#A855F7", color: "#fff", fontWeight: 700,
  } as const;

  const handleUpload = async () => {
    setLoading(true);
    setStatus("Mengirim ke TikTok...");
    try {
      const res = await fetch("/api/tiktok/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Berhasil dikirim! (${data.note})`);
    } catch (e: any) {
      setStatus(e.message || "Gagal upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🎬 TikTok Auto Upload</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>
          Hubungkan akun TikTok, lalu upload video langsung dari URL.
        </p>

        {connected && (
          <div style={{ marginBottom: 16, padding: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, fontSize: 13, color: "#86EFAC" }}>
            ✅ Akun TikTok berhasil terhubung.
          </div>
        )}

        <a
          href="/api/auth/tiktok"
          style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none", marginBottom: 24 }}
        >
          Hubungkan Akun TikTok
        </a>

        <input
          type="text"
          placeholder="URL video (harus bisa diakses publik, misal dari cloud storage)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Judul/caption video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <button disabled={loading} onClick={handleUpload} style={btnStyle}>
          {loading ? "Mengirim..." : "Upload ke TikTok"}
        </button>

        {status && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{status}</p>}

        <p style={{ marginTop: 24, fontSize: 11.5, color: "#6B6178", lineHeight: 1.6 }}>
          Catatan: video akan terkirim sebagai <b>Private (SELF_ONLY)</b> sampai app TikTok kamu
          melewati proses audit resmi TikTok. Setelah diaudit, privacy_level bisa diubah ke publik.
        </p>
      </div>
    </div>
  );
}
