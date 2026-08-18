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
      // Kita gunakan kombinasi API andalan dan beberapa layanan CORS Proxy Publik
      const targetApiUrl = `https://api.keybypass.net/bypass?url=${encodeURIComponent(url)}&hwid=`;
      
      // CORS Proxies
      const proxies = [
        `https://corsproxy.io/?url=${encodeURIComponent(targetApiUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApiUrl)}`,
        `https://cors-anywhere.herokuapp.com/${targetApiUrl}` // Biasanya butuh akses manual, taruh di akhir
      ];

      let isSuccess = false;

      for (const proxyUrl of proxies) {
        try {
          const res = await fetch(proxyUrl, {
            // Karena ini dari client side, timeout tidak menggunakan AbortSignal (kadang gak didukung semua browser)
          });

          if (!res.ok) continue;

          const json = await res.json();

          if (json.status === "success" || json.destination || json.result) {
            setResult(json.destination || json.result || json.bypassed_link);
            isSuccess = true;
            break; // Jika sukses, keluar dari loop
          }
        } catch (innerErr) {
          console.warn("Proxy gagal, mencoba proxy selanjutnya...", proxyUrl);
          continue;
        }
      }

      if (!isSuccess) {
         // Coba Fallback tanpa CORS Proxy, barangkali API-nya sedang longgar
         const directRes = await fetch(`https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`).catch(()=>null);
         if(directRes && directRes.ok){
            const directJson = await directRes.json();
            if(directJson.result || directJson.destination){
                setResult(directJson.result || directJson.destination);
                isSuccess = true;
            }
         }
      }

      if (!isSuccess) {
        setError("Lootlabs sedang sangat tangguh atau link sudah kedaluwarsa. Sistem proxy gagal menembus keamanan mereka saat ini.");
      }

    } catch (err) {
      setError("Terjadi kesalahan sistem di browser Anda. Coba lagi.");
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
              {loading ? "Menembus Keamanan via Client Proxy..." : "Bypass →"}
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
