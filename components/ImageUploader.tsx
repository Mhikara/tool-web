"use client";
import { useState, useRef } from "react";

type ImageUploaderProps = {
  onUploaded: (url: string) => void;
  label?: string;
};

export default function ImageUploader({ onUploaded, label }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/external/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      onUploaded(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal upload gambar");
    } finally {
      setLoading(false);
    }
  };

  const wrap = {
    border: "1px dashed rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 16,
    textAlign: "center" as const,
    background: "#1C1226",
    cursor: "pointer",
  };

  return (
    <div>
      <div
        style={wrap}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, marginBottom: 8 }}
          />
        ) : (
          <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
        )}
        <div style={{ fontSize: 13, color: "#9C90AC" }}>
          {loading ? "Mengunggah..." : label || "Klik untuk pilih gambar"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && (
        <div style={{ color: "#F87171", fontSize: 12.5, marginTop: 8 }}>{error}</div>
      )}
    </div>
  );
}
