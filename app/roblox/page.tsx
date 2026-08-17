"use client";

import { useState, useEffect } from "react";

export default function RobloxScriptFinder() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeSearch, setActiveSearch] = useState(""); // Menyimpan kata kunci yang sedang dicari

  useEffect(() => {
    const fetchLiveUpload = async () => {
      try {
        const res = await fetch(`/api/roblox`);
        const json = await res.json();
        if (res.ok) {
          setData(json.results || []);
        } else {
          setError(json.error || "Gagal memuat rekomendasi live.");
        }
      } catch (err) {
        setError("Gagal terhubung ke server.");
      } finally {
        setLoading(false);
      }
    };
    fetchLiveUpload();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setError("");
    setData([]);
    setActiveSearch(query);

    try {
      const res = await fetch(`/api/roblox?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      if (res.ok) {
        setData(json.results || []);
        if (json.results.length === 0) setError("Script tidak ditemukan.");
      } else {
        setError(json.error || "Terjadi kesalahan.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">Roblox SC Finder</h1>
        <p className="text-center text-gray-400 mb-8">Cari Script No Key & Anti-Patched secara Real-Time</p>

        {/* Form Pencarian */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Cari game (misal: Blox Fruits)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading && query ? "Mencari..." : "Cari"}
          </button>
        </form>

        {/* Panduan Kamus Fitur (Mini Guide) */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8">
          <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
            <span>💡</span> Panduan Istilah Fitur SC:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
            <p><strong className="text-blue-400">Auto Farm:</strong> Otomatis menaikkan level, uang, atau mengumpulkan item tanpa dimainkan.</p>
            <p><strong className="text-blue-400">ESP (Wallhack):</strong> Melihat musuh, bos, atau item penting tembus pandang/dinding.</p>
            <p><strong className="text-blue-400">Aimbot:</strong> Tembakan otomatis mengunci musuh (sangat berguna di game FPS).</p>
            <p><strong className="text-blue-400">No Key:</strong> Script langsung aktif, tidak perlu verifikasi iklan di website lain.</p>
            <p><strong className="text-blue-400">Anti-AFK:</strong> Mencegah akun keluar (ter-kick) otomatis jika ditinggal lama.</p>
            <p><strong className="text-blue-400">Teleport/Tween:</strong> Berpindah tempat ke lokasi tertentu dengan sangat cepat.</p>
          </div>
        </div>

        {error && <div className="text-red-400 text-center mb-4">{error}</div>}

        {/* Indikator Status (Pencarian vs Live Upload) */}
        {!loading && !error && data.length > 0 && (
          <div className="mb-6 flex flex-col items-center text-center">
            {!activeSearch ? (
              <span className="bg-red-600/20 text-red-400 border border-red-500/50 text-xs font-bold px-4 py-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                🔴 LIVE UPLOAD (TERBARU GLOBAL)
              </span>
            ) : (
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/50 text-sm font-bold px-4 py-2 rounded-full">
                🔍 Menampilkan hasil pencarian: "{activeSearch}"
              </span>
            )}
          </div>
        )}

        {loading && !activeSearch && (
          <div className="text-center text-gray-400 mb-4 animate-pulse font-medium">
            Memuat script yang baru saja diunggah ke dunia...
          </div>
        )}

        {/* Menampilkan Kartu Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-100">{item.title}</h2>
                  <p className="text-sm text-blue-400 font-medium">Game: {item.game}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded text-white ${item.source.includes('Live') ? 'bg-red-600 animate-pulse' : 'bg-gray-700'}`}>
                  {item.source}
                </span>
              </div>
              
              <div className="text-sm text-gray-400 mb-4 flex-1">
                <span className="font-semibold text-gray-300">Fitur:</span> {item.features}
              </div>

              <div className="relative">
                <pre className="bg-black p-3 rounded-lg text-xs text-green-400 overflow-x-auto h-24 mb-3 border border-gray-700">
                  {item.scriptCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(item.scriptCode, idx)}
                  className={`w-full py-2 rounded font-bold transition ${
                    copiedIndex === idx ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                >
                  {copiedIndex === idx ? "Berhasil Disalin! ✓" : "Copy Script"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
