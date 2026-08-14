"use client";

import { useState } from "react";
import { ScanText, Loader2, Languages, X } from "lucide-react";

type Props = {
  /** URL gambar (boleh /api/komik/image?url=...) */
  imageUrl: string;
};

export default function OcrTranslate({ imageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [idText, setIdText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"ocr" | "id">("ocr");

  const runOcr = async () => {
    if (!imageUrl) return;
    setOpen(true);
    setLoading(true);
    setStatus("Memuat engine OCR…");
    setRaw("");
    setIdText("");
    setMode("ocr");

    try {
      // dynamic import biar bundle reader tidak membengkak di first paint
      const Tesseract = (await import("tesseract.js")).default;

      setStatus("Membaca teks dari gambar…");
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) {
            setStatus(`OCR ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = (result?.data?.text || "").trim();
      if (!text) {
        setStatus("Tidak ada teks terdeteksi");
        setRaw("");
        return;
      }
      setRaw(text);
      setStatus("OCR selesai");
    } catch (e: any) {
      setStatus(e?.message || "OCR gagal");
    } finally {
      setLoading(false);
    }
  };

  const toId = async () => {
    if (!raw) return;
    setLoading(true);
    setStatus("Menerjemahkan ke Indonesia…");
    try {
      // potong jika terlalu panjang
      const chunk = raw.slice(0, 4000);
      const res = await fetch("/api/komik/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Translate gagal");
      setIdText(j.translated || "");
      setMode("id");
      setStatus("Selesai");
    } catch (e: any) {
      setStatus(e?.message || "Translate gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={runOcr}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ScanText className="h-3.5 w-3.5" />
        )}
        OCR / Translate
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold text-white">Teks dari gambar</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
              <p className="mb-2 text-[11px] text-zinc-500">{status}</p>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {mode === "id" && idText ? idText : raw || "—"}
              </pre>
            </div>

            <div className="flex gap-2 border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => setMode("ocr")}
                className="flex-1 rounded-xl bg-zinc-800 py-2 text-xs font-semibold text-zinc-200"
              >
                Teks OCR
              </button>
              <button
                type="button"
                onClick={toId}
                disabled={!raw || loading}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Languages className="h-3.5 w-3.5" />
                Ke Indonesia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
