"use client";

import { useState, useEffect } from "react";

interface MediaItem {
  type: "video" | "image";
  hdUrl: string;
  sdUrl: string;
  thumbnail?: string;
}

interface SavedMedia {
  id: string;
  sourceUrl: string;
  mediaUrl: string;
  quality: "HD" | "SD";
  type: "video" | "image";
  date: string;
}

export default function InstagramDownloaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [history, setHistory] = useState<SavedMedia[]>([]);

  // 1. Ambil data dari Local Storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ig_downloader_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Gagal membaca LocalStorage", e);
    }
  }, []);

  // 2. Simpan Riwayat Unduhan ke Local Storage
  const saveToLocalStorage = (mediaUrl: string, quality: "HD" | "SD", type: "video" | "image", sourceUrl: string) => {
    try {
      const newItem: SavedMedia = {
        id: `${Date.now()}`,
        sourceUrl,
        mediaUrl,
        quality,
        type,
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      const updated = [newItem, ...history.filter(h => h.mediaUrl !== mediaUrl)].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("ig_downloader_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Gagal menyimpan ke LocalStorage", e);
    }
  };

  // 3. Tombol Tempel Clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      alert("Silakan tekan lama pada kolom input lalu pilih Tempel.");
    }
  };

  // 4. Proses Ekstraksi Media
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = url.trim();
    if (!cleanInput) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/downloader/instagram?url=${encodeURIComponent(cleanInput)}`);
      const data = await res.json();

      if (res.ok && data.success && data.media?.length > 0) {
        setResults(data.media);
      } else {
        setError(data.error || "Gagal mengunduh media. Pastikan video/foto tidak diprivat.");
      }
    } catch {
      setError("Terjadi gangguan jaringan ke server. Coba ulangi kembali.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("ig_downloader_history");
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-gray-800 font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#ff4a11] flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20">
            🔻
          </div>
          <span className="font-extrabold text-xl text-gray-900 tracking-tight">
            Download <span className="text-[#ff4a11]">Instagram</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-600 text-sm font-medium">
          <span>🌙</span>
          <span className="cursor-pointer">☰</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 md:py-14 flex flex-col items-center">
        
        {/* Badge Cepat & Gratis */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-[#ff4a11] text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#ff4a11] animate-pulse"></span>
          Cepat & Gratis
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 text-center tracking-tight mb-3">
          Pengunduh Instagram
        </h1>
        <p className="text-gray-500 text-sm md:text-base text-center mb-8">
          Download Reels, Video & Foto dalam Resolusi HD atau Standar
        </p>

        {/* Input Card Container */}
        <div className="w-full max-w-2xl bg-white border border-gray-200/80 rounded-3xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <form onSubmit={handleDownload} className="flex flex-col gap-4">
            
            {/* Input Row dengan Tombol Tempel */}
            <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:border-[#ff4a11] focus-within:bg-white transition-all">
              <span className="pl-3 text-gray-400 text-lg">🔗</span>
              <input
                type="text"
                placeholder="Tempel link Instagram di sini..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-gray-800 text-sm placeholder-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="bg-gray-200/80 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shrink-0"
              >
                Tempel
              </button>
            </div>

            {/* Tombol Download Utama */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff4a11] hover:bg-[#e43f0c] text-white font-bold text-base py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Sedang Mengambil Media dari Instagram..." : "Download →"}
            </button>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Hasil Download Langsung */}
          {results.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hasil Siap Unduh:</p>
                <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-semibold">
                  ✓ Berhasil Diekstrak
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {results.map((item, idx) => (
                  <div key={idx} className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
                    
                    {/* Media Preview Player */}
                    <div className="w-full md:w-44 h-48 md:h-36 shrink-0 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                      {item.type === "video" ? (
                        <video src={item.hdUrl} controls playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.hdUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Tombol Pilihan Unduhan (HD vs SD) */}
                    <div className="flex-1 w-full flex flex-col justify-center gap-2.5">
                      <div className="text-left mb-1">
                        <span className="text-[11px] font-bold uppercase text-[#ff4a11]">
                          Format: {item.type === "video" ? "MP4 Video" : "JPG Image"}
                        </span>
                        <h4 className="text-sm font-bold text-gray-800">Pilih Kualitas Resolusi:</h4>
                      </div>

                      {/* Resolusi HD */}
                      <a
                        href={item.hdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="instagram_media_hd.mp4"
                        onClick={() => saveToLocalStorage(item.hdUrl, "HD", item.type, url)}
                        className="w-full bg-gradient-to-r from-[#ff4a11] to-orange-500 hover:from-[#e43f0c] hover:to-orange-600 text-white text-xs font-bold py-3 px-4 rounded-xl text-center shadow-md shadow-orange-500/20 transition-all flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-extrabold">HD</span>
                          <span>Download Resolusi HD (1080p)</span>
                        </span>
                        <span>📥</span>
                      </a>

                      {/* Resolusi Biasa */}
                      <a
                        href={item.sdUrl || item.hdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="instagram_media_sd.mp4"
                        onClick={() => saveToLocalStorage(item.sdUrl || item.hdUrl, "SD", item.type, url)}
                        className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-xl text-center transition-all flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold">SD</span>
                          <span>Download Resolusi Standar</span>
                        </span>
                        <span>⚡</span>
                      </a>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION: RIWAYAT PENYIMPANAN LOCAL STORAGE */}
        {history.length > 0 && (
          <div className="w-full max-w-2xl bg-white border border-gray-200/80 rounded-3xl p-5 mb-14 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>💾</span> Riwayat Tersimpan di Local Storage
              </h3>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Hapus Riwayat
              </button>
            </div>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${h.quality === 'HD' ? 'bg-[#ff4a11]' : 'bg-gray-600'}`}>
                        {h.quality}
                      </span>
                      <span className="font-semibold text-gray-800 uppercase text-[10px]">{h.type} • {h.date}</span>
                    </div>
                    <p className="text-gray-500 truncate text-[11px]">{h.sourceUrl}</p>
                  </div>
                  <a
                    href={h.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-200 hover:bg-[#ff4a11] hover:text-white text-gray-700 font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    Unduh Lagi
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION ARTIKEL / EDUKASI */}
        <section className="w-full max-w-2xl text-center border-t border-gray-200 pt-10">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-snug">
            Mengapa menggunakan <span className="text-[#ff4a11]">pengunduh Instagram</span> kami?
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8">
            Pengunduh Instagram gratis kami memungkinkan Anda menyimpan Reels, video, dan foto dari Instagram secara instan. Unduh konten Instagram dalam kualitas HD atau resolusi standar hemat kuota hanya dengan satu klik.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-2xl block mb-2">💎</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Resolusi HD & SD</h4>
              <p className="text-gray-500 text-xs">Pilihan unduh 1080p jernih atau resolusi standar hemat data.</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-2xl block mb-2">⚡</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Cepat & Instan</h4>
              <p className="text-gray-500 text-xs">Cukup tempel link dan media langsung siap diputar atau diunduh.</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-2xl block mb-2">🔒</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Local Storage</h4>
              <p className="text-gray-500 text-xs">Riwayat tersimpan aman di browser perangkat Anda sendiri.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
