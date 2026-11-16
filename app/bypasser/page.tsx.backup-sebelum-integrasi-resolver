"use client";

import { useState } from "react";

export default function BypasserPage() {
  const [url, setUrl] = useState("");
  const [targetDestination, setTargetDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<{
    platform: string;
    label: string;
    hostname: string;
    fileType: string | null;
    isDirectFile: boolean;
    fileName: string;
    fileSizeLabel: string;
  } | null>(null);

  const handleBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setTargetDestination("");
    setDetectedInfo(null);
    setCopied(false);

    try {
      const res = await fetch(
        `/api/bypass/detect?url=${encodeURIComponent(url.trim())}`,
        { method: "GET", cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || `Gagal mendeteksi link (${res.status}).`);
      }

      let preview = null;

      try {
        const previewRes = await fetch(
          `/api/bypass/preview?url=${encodeURIComponent(url.trim())}`,
          { method: "GET", cache: "no-store" }
        );
        const previewData = await previewRes.json();

        if (previewRes.ok && previewData.success && previewData.data) {
          preview = previewData.data;
        }
      } catch {
        preview = null;
      }

      setDetectedInfo({
        ...data.data,
        fileName: preview?.fileName || "Nama file belum tersedia",
        fileSizeLabel: preview?.fileSizeLabel || "Belum tersedia"
      });
      setTargetDestination(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendeteksi link.");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(targetDestination);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setUrl("");
    setTargetDestination("");
    setDetectedInfo(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white flex flex-col items-center p-6 font-sans">
      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-12 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-2xl">📚</span>
          <h1 className="text-xl font-bold tracking-wide">
            Eon<span className="text-emerald-400">Bypass</span>
          </h1>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center mb-10 leading-tight">
          Unlock Any <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Linkvertise
          </span> <br />
          Bypasser
        </h2>

        {/* Kotak Utama */}
        <div className="w-full bg-[#111827] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

          {!detectedInfo ? (
            /* Form Input */
            <form onSubmit={handleBypass} className="flex flex-col gap-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔗</span>
                <input
                  type="text"
                  placeholder="Paste link shortener (Linkvertise, Workink, dll)..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#0a0f16] border border-gray-700 text-gray-200 placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-gray-900 font-bold text-lg py-4 rounded-2xl transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? "Mendeteksi Link..." : "Deteksi Link →"}
              </button>
            </form>
          ) : (
            /* Tampilan Halaman Hasil Sukses (Di dalam web sendiri) */
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 text-2xl mb-4">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-1">Link Berhasil Dideteksi!</h3>
              <p className="text-gray-400 text-xs mb-6 text-center">Informasi tautan yang berhasil dikenali:</p>

              <div className="w-full bg-[#0a0f16] p-4 rounded-2xl border border-emerald-500/30 text-sm mb-6 shadow-inner space-y-3">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Platform</span>
                  <span className="text-emerald-400 font-semibold">{detectedInfo?.label}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Jenis file</span>
                  <span className="text-gray-200">{detectedInfo?.fileType || "Belum diketahui"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Nama file</span>
                  <span className="text-gray-200 text-right break-all">{detectedInfo?.fileName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Ukuran file</span>
                  <span className="text-gray-200">{detectedInfo?.fileSizeLabel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Tautan langsung</span>
                  <span className="text-gray-200">{detectedInfo?.isDirectFile ? "Ya" : "Tidak terdeteksi"}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 break-all text-emerald-400 font-mono text-xs">
                  {targetDestination}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mb-4">
                <button
                  onClick={copyResult}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3.5 px-6 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border border-gray-700"
                >
                  {copied ? "✓ Link Tersalin!" : "📋 Salin Link Tujuan"}
                </button>

                <a
                  href={targetDestination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-gray-950 py-3.5 px-6 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  ↗ Buka Link Asli
                </a>
              </div>

              <button
                onClick={resetForm}
                className="text-xs text-gray-400 hover:text-gray-200 underline mt-2 transition-colors"
              >
                ← Periksa Link Lainnya
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        <p className="text-gray-500 text-sm mt-10 text-center max-w-lg">
          Deteksi Direct Link, Google Drive, MediaFire, Dropbox, GitHub, Linkvertise, Workink, dan Sub2Unlock.
        </p>
      </div>
    </div>
  );
}
