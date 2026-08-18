"use client";

import { useState, useEffect } from "react";

// Link Saluran WhatsApp Resmi Kamu
const WHATSAPP_CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb8erb77dmeQXwxjrQ3U";

const QUICK_GAMES = [
  "Blox Fruits",
  "Pet Simulator 99",
  "Fisch",
  "Arsenal",
  "Brookhaven",
  "Da Hood",
  "Blade Ball",
  "Anime Defenders",
  "Doors",
  "Rivals"
];

const CATEGORIES = ["Semua", "Auto Farm", "Combat / Aim", "Universal", "Verified"];

export default function RobloxPage() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchScripts = async (searchTerm: string, pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");

    try {
      const url = `/api/roblox?q=${encodeURIComponent(searchTerm)}&page=${pageNum}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.results)) {
        if (append) {
          setData((prev) => [...prev, ...json.results]);
        } else {
          setData(json.results);
        }
        if (json.results.length === 0 && pageNum === 1) {
          setError("Script tidak ditemukan untuk pencarian ini.");
        }
      } else {
        setError(json.error || "Terjadi kesalahan saat memuat data.");
      }
    } catch {
      setError("Gagal terhubung ke database server.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchScripts("");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveQuery(query);
    fetchScripts(query, 1, false);
  };

  const handleTagClick = (gameName: string) => {
    setQuery(gameName);
    setActiveQuery(gameName);
    setPage(1);
    fetchScripts(gameName, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 2;
    setPage(nextPage);
    fetchScripts(activeQuery, nextPage, true);
  };

  const copyScript = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const filteredData = data.filter((item) => {
    if (selectedCategory === "Semua") return true;
    const titleLower = item.title.toLowerCase();
    const gameLower = item.game.toLowerCase();
    if (selectedCategory === "Auto Farm") return titleLower.includes("auto") || titleLower.includes("farm");
    if (selectedCategory === "Combat / Aim") return titleLower.includes("aim") || titleLower.includes("esp") || titleLower.includes("hitbox");
    if (selectedCategory === "Universal") return gameLower.includes("universal");
    if (selectedCategory === "Verified") return item.verified === true;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* BANNER SALURAN WHATSAPP REAL-TIME */}
        <div className="mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-green-900/30 to-[#111827] border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
              💬
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                Saluran Update SC WhatsApp
                <span className="bg-emerald-500 text-gray-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">HARIAN</span>
              </h3>
              <p className="text-xs text-gray-300">Dapatkan notifikasi script Roblox terbaru, verified, dan keyless langsung di WhatsApp Anda setiap hari.</p>
            </div>
          </div>
          <a
            href={WHATSAPP_CHANNEL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            <span>📱</span> Gabung Saluran WA
          </a>
        </div>

        {/* Header Bar */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <span>⚡</span> Real-Time Database Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Roblox <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">SC Finder</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
            Database script Roblox terbaru, verified anti-patch, dan bebas key system.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Cari game (misal: Blox Fruits, Fisch, Arsenal)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#111827] border border-gray-800 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-blue-500 text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? "Mencari..." : "Cari SC"}
          </button>
        </form>

        {/* Quick Tag Recommendations */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-gray-500 font-semibold shrink-0 mr-1">🔥 Populer:</span>
            {QUICK_GAMES.map((game) => (
              <button
                key={game}
                onClick={() => handleTagClick(game)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                  activeQuery === game
                    ? "bg-blue-600 border-blue-500 text-white font-bold"
                    : "bg-[#111827] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-4 py-2 rounded-xl transition-all font-medium ${
                selectedCategory === cat
                  ? "bg-gray-200 text-gray-900 font-bold shadow"
                  : "bg-[#111827] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="text-xs text-gray-400">
            {activeQuery ? (
              <span>Hasil untuk: <b className="text-blue-400">"{activeQuery}"</b></span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live Feed Database Global</span>
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {filteredData.length} Script Ditampilkan
          </div>
        </div>

        {/* Error / Loading State */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/40 text-red-400 rounded-2xl text-center text-sm mb-8">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 h-64 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-6"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-gray-800 rounded w-full"></div>
                  <div className="h-3 bg-gray-800 rounded w-4/5"></div>
                </div>
                <div className="h-10 bg-gray-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Main Grid Card */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredData.map((item, idx) => {
              const isUniversal = item.game.toLowerCase().includes("universal");

              return (
                <div
                  key={idx}
                  className="bg-[#111827] border border-gray-800/80 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-blue-500/5"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-100 truncate">{item.title}</h2>
                        <span className="text-xs text-blue-400 font-medium">🎮 {item.game}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                          No Key
                        </span>
                        <span className="bg-gray-800 text-gray-400 text-[11px] px-2.5 py-0.5 rounded-full border border-gray-700">
                          {item.source}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-300 mb-2">Detail Fitur:</p>
                      <ul className="space-y-1.5 text-xs text-gray-400">
                        {item.features.map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isUniversal && (
                      <div className="p-3.5 mb-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 space-y-1">
                        <p className="font-bold text-indigo-400">💡 Rekomendasi Game Universal:</p>
                        <p>• <b>FPS/Shooter:</b> Arsenal, Da Hood, Phantom Forces, Rivals.</p>
                        <p>• <b>Obby/Movement:</b> Tower of Hell, Brookhaven RP, Doors.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/80">
                    <pre className="bg-[#090d16] p-3 rounded-xl text-[11px] text-emerald-400 font-mono overflow-x-auto h-20 mb-3 border border-gray-800 select-all">
                      {item.scriptCode}
                    </pre>

                    <button
                      onClick={() => copyScript(item.scriptCode, idx)}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        copiedIdx === idx
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                      }`}
                    >
                      {copiedIdx === idx ? (
                        <><span>✓</span> Berhasil Disalin ke Clipboard!</>
                      ) : (
                        <><span>📋</span> Copy Loadstring</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredData.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-[#111827] hover:bg-gray-800 border border-gray-700 text-gray-300 px-8 py-3.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {loadingMore ? "Memuat Tambahan SC..." : "Muat Lebih Banyak Script ↓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
