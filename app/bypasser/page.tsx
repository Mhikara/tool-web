"use client";

import { useState } from "react";

export default function BypasserPage() {
  const [url, setUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Link harus diawali dengan http:// atau https://");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedLink("");
    setCopied(false);

    try {
      // 1. Coba bypass via resolver multi-engine terlebih dahulu
      const providers = [
        `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`,
        `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`,
        `https://dl.dirbaio.dev/api/bypass?url=${encodeURIComponent(url)}`
      ];

      let targetResult = "";

      for (const apiUrl of providers) {
        try {
          const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;

          const data = await res.json();
          const out = data.destination || data.result || data.bypassed_link || data.url;

          if (out && typeof out === "string" && out.startsWith("http")) {
            targetResult = out;
            break;
          }
        } catch {
          continue;
        }
      }

      // 2. Jika resolver otomatis menemukan link, tampilkan link final
      // Jika terhambat proteksi ketat, generate gateway link resmi
      if (targetResult) {
        setGeneratedLink(targetResult);
      } else {
        const officialGateway = `https://keybypass.net/?url=${encodeURIComponent(url)}`;
        setGeneratedLink(officialGateway);
      }
    } catch {
      setError("Gagal memproses link. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white flex flex-col items-center p-6 font-sans">
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

        <div className="w-full bg-[#111827] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔗</span>
              <input
                type="text"
                placeholder="Paste your shortened link here..."
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
              {loading ? "Generating Bypass Link..." : "Generate Link →"}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center text-sm font-medium">
              {error}
            </div>
          )}

          {/* Kartu Output Hasil Generate */}
          {generatedLink && (
            <div className="mt-8 p-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500">
              <div className="bg-[#0a0f16] p-6 rounded-[14px] flex flex-col items-center">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-3">
                  <span>⚡</span> Link Siap Digunakan
                </div>

                <div className="w-full bg-[#111827] p-4 rounded-xl border border-gray-800 break-all text-gray-200 font-mono text-xs md:text-sm mb-5 text-center select-all">
                  {generatedLink}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    onClick={copyResult}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border border-gray-700"
                  >
                    {copied ? "✓ Tersalin!" : "📋 Salin Link"}
                  </button>

                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-gray-950 py-3 px-6 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    🚀 Buka Link Langsung
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-sm mt-10 text-center max-w-lg">
          Support untuk Linkvertise, Workink, Lootlabs, Fluxus Key, Delta Key, dan ratusan layanan lainnya.
        </p>
      </div>
    </div>
  );
}
