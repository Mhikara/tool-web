"use client";

import { useState } from "react";

export default function BypasserPage() {
  const [url, setUrl] = useState("");
  const [targetDestination, setTargetDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Link harus diawali dengan http:// atau https://");
      return;
    }

    setLoading(true);
    setError("");
    setTargetDestination("");
    setCopied(false);

    try {
      // Daftar engine resolver internal untuk mendapatkan tujuan akhir asli
      const providers = [
        `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`,
        `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`,
        `https://dl.dirbaio.dev/api/bypass?url=${encodeURIComponent(url)}`
      ];

      let finalUrl = "";

      for (const apiUrl of providers) {
        try {
          const res = await fetch(apiUrl, { signal: AbortSignal.timeout(9000) });
          if (!res.ok) continue;

          const data = await res.json();
          const out = data.destination || data.result || data.bypassed_link || data.url;

          // Validasi: pastikan output bukan link bypasser lain, melainkan link tujuan asli
          if (
            out &&
            typeof out === "string" &&
            out.startsWith("http") &&
            !out.includes("bypass")
          ) {
            finalUrl = out;
            break;
          } else if (out && typeof out === "string" && out.startsWith("http")) {
            finalUrl = out;
            break;
          }
        } catch {
          continue;
        }
      }

      if (finalUrl) {
        setTargetDestination(finalUrl);
      } else {
        setError("Gagal mendapatkan link tujuan akhir. Link mungkin sudah kedaluwarsa atau proteksi terlalu ketat.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memproses link. Coba muat ulang halaman.");
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

          {!targetDestination ? (
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
                {loading ? "Mengekstrak Link Tujuan..." : "Bypass Sekarang →"}
              </button>
            </form>
          ) : (
            /* Tampilan Halaman Hasil Sukses (Di dalam web sendiri) */
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 text-2xl mb-4">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-1">Link Berhasil Ditemukan!</h3>
              <p className="text-gray-400 text-xs mb-6 text-center">Berikut link tujuan akhir tanpa melewati iklan:</p>

              <div className="w-full bg-[#0a0f16] p-4 rounded-2xl border border-emerald-500/30 break-all text-emerald-400 font-mono text-sm mb-6 text-center select-all shadow-inner">
                {targetDestination}
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
                  🚀 Buka Halaman Tujuan
                </a>
              </div>

              <button
                onClick={resetForm}
                className="text-xs text-gray-400 hover:text-gray-200 underline mt-2 transition-colors"
              >
                ← Bypass Link Lainnya
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
          Support untuk Linkvertise, Workink, Sub2Unlock, Booster, dan shortener langsung lainnya.
        </p>
      </div>
    </div>
  );
}
