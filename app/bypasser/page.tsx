"use client";

import { useState } from "react";

export default function BypasserPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    if (!url.startsWith("http")) {
      setError("Link harus diawali dengan http:// atau https://");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      // Mengirim link ke Backend Vercel kita sendiri untuk menghindari blokir CORS
      const res = await fetch(`/api/bypass?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      
      if (res.ok && json.success) {
        setResult(json.result);
      } else {
        setError(json.error || "Gagal mem-bypass link. Pastikan link masih aktif.");
      }
    } catch (err) {
      setError("Server internal error / timeout. Coba muat ulang halaman.");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-3xl flex justify-between items-center mb-16 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-2xl">📚</span>
          <h1 className="text-xl font-bold tracking-wide">
            Eon<span className="text-emerald-400">Bypass</span>
          </h1>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center mb-12 leading-tight">
          Unlock Any <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Linkvertise
          </span> <br />
          Bypasser
        </h2>

        <div className="w-full bg-[#111827] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

          <form onSubmit={handleBypass} className="flex flex-col gap-5">
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
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-gray-900 font-bold text-lg py-4 rounded-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {loading ? "Menerobos Keamanan... (Tunggu sebentar)" : "Bypass →"}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-center text-sm font-medium">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 p-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500">
              <div className="bg-[#0a0f16] p-6 rounded-[14px] flex flex-col items-center">
                <p className="text-gray-400 text-sm mb-3">✅ Berhasil Buka Kunci Target Link:</p>
                <div className="w-full bg-[#111827] p-4 rounded-xl border border-gray-800 break-all text-emerald-400 font-mono text-sm mb-4 text-center">
                  {result}
                </div>
                <button
                  onClick={copyResult}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold transition-colors w-full md:w-auto"
                >
                  {copied ? "Tersalin ke Clipboard!" : "Copy Hasil Link"}
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-12 text-center max-w-lg">
          Support untuk Linkvertise, Workink, Lootlabs, Fluxus Key, Delta Key, dll. 100% otomatis tanpa verifikasi manusia.
        </p>
      </div>
    </div>
  );
}
