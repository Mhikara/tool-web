"use client";
import { useState, use } from "react";
import { getDownloaderBySlug } from "@/lib/downloaderTools";
import { notFound } from "next/navigation";

export default function DownloaderDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tool = getDownloaderBySlug(slug);
  if (!tool) return notFound();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");

  const handleDownload = async () => {
    setStatus("Memproses...");
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("gagal");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "download";
      link.click();
      setStatus("Selesai diunduh.");
    } catch {
      setStatus("Gagal mengunduh. Pastikan link berupa file media langsung.");
    }
  };

  return (
    <div style={{ background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {tool.icon} {tool.title}
        </h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>{tool.description}</p>

        <input
          type="text"
          placeholder={`Paste link ${tool.title} di sini...`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1C1226",
            color: "#F3EEFA",
          }}
        />
        <button
          onClick={handleDownload}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#A855F7",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Download
        </button>
        {status && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{status}</p>}

        <p style={{ marginTop: 24, fontSize: 11.5, color: "#6B6178", lineHeight: 1.6 }}>
          Catatan: endpoint downloader dasar ini hanya mendukung link file media langsung
          (berakhiran .mp4/.jpg/.mp3 dsb). Untuk platform seperti {tool.title} yang butuh parsing
          halaman khusus, backend perlu ditambah library ekstraksi sesuai platform.
        </p>
      </div>
    </div>
  );
}
