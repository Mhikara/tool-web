"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");

  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const handleDownload = async () => {
    setDownloadStatus("Memproses...");
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Gagal download");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "file-download";
      link.click();

      setDownloadStatus("Selesai diunduh.");
    } catch (err) {
      setDownloadStatus("Gagal mengunduh.");
    }
  };

  const handleAI = async () => {
    setLoadingAI(true);
    setAiResult("");
    try {
      const res = await fetch("/api/ai-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || JSON.stringify(data);
      setAiResult(text);
    } catch (err) {
      setAiResult("Terjadi kesalahan.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Tool Web</h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Media Downloader</h2>
        <input
          type="text"
          placeholder="Paste link media di sini..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          onClick={handleDownload}
          style={{ width: "100%", padding: 10, background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8 }}
        >
          Download
        </button>
        {downloadStatus && <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>{downloadStatus}</p>}
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>AI Maker</h2>
        <textarea
          placeholder="Tulis prompt untuk AI..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          onClick={handleAI}
          disabled={loadingAI}
          style={{ width: "100%", padding: 10, background: "#EC4899", color: "#fff", border: "none", borderRadius: 8 }}
        >
          {loadingAI ? "Memproses..." : "Kirim ke AI"}
        </button>
        {aiResult && (
          <div style={{ marginTop: 12, padding: 12, background: "#f5f5f5", borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {aiResult}
          </div>
        )}
      </section>
    </main>
  );
}
