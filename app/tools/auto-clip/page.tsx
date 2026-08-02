"use client";
import { useState } from "react";

export default function AutoClipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const wrap = { background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 };
  const inputStyle = {
    width: "100%", padding: 12, marginBottom: 12, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", background: "#1C1226", color: "#F3EEFA",
  } as const;
  const btnStyle = {
    width: "100%", padding: 12, borderRadius: 10, border: "none",
    background: "#A855F7", color: "#fff", fontWeight: 700,
  } as const;

  const handleSubmit = async () => {
    if (!file) {
      setStatus("Pilih file video dulu.");
      return;
    }
    setLoading(true);
    setStatus("Memproses video, mohon tunggu...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clipDuration", String(duration));

      const res = await fetch("/api/clip", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "clips.zip";
      link.click();
      setStatus("Selesai! File clips.zip terunduh.");
    } catch (e: any) {
      setStatus(e.message || "Gagal memproses video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>✂️ Auto Clip</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>
          Upload video, otomatis dipotong jadi beberapa klip per interval waktu.
        </p>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 16, color: "#9C90AC" }}
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#9C90AC" }}>
          Durasi per klip (detik)
        </label>
        <input
          type="number"
          min={5}
          max={120}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={inputStyle}
        />

        <button disabled={loading} onClick={handleSubmit} style={btnStyle}>
          {loading ? "Memproses..." : "Potong Video"}
        </button>

        {status && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{status}</p>}

        <p style={{ marginTop: 24, fontSize: 11.5, color: "#6B6178", lineHeight: 1.6 }}>
          Catatan: maksimal 15 klip per proses, dan video besar/panjang berisiko gagal karena batas
          waktu server (~60 detik). Cocok untuk video pendek-menengah.
        </p>
      </div>
    </div>
  );
}
