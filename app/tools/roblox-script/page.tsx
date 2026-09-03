"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Copy, Check, Code, Key, ShieldCheck, 
  Gamepad2, Sparkles, Loader2, ChevronLeft, ChevronRight, 
  AlertTriangle, Lock, Unlock, Terminal 
} from "lucide-react";

interface RobloxScript {
  id: string;
  title: string;
  gameName: string;
  gameImage: string;
  script: string;
  scriptType: string;
  verified: boolean;
  key: boolean;
  isPatched: boolean;
  isUniversal: boolean;
  views: number;
}

const QUICK_TAGS = [
  "Blox Fruits",
  "King Legacy",
  "Pet Simulator 99",
  "Door",
  "Arsenal",
  "Jujutsu Shenanigans",
  "Universal"
];

export default function RobloxScriptPage() {
  const [query, setQuery] = useState("");
  const [scripts, setScripts] = useState<RobloxScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState<"all" | "no-key" | "universal">("all");

  const fetchScripts = async (searchQuery: string, pageNum: number, filter: string) => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/roblox-script?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`;
      if (filter === "no-key") url += `&key=0`;
      if (filter === "universal") url += `&universal=1`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memuat script Roblox.");
      }

      setScripts(data.scripts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat script.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts(query, page, filterKey);
  }, [page, filterKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchScripts(query, 1, filterKey);
  };

  const handleQuickTag = (tag: string) => {
    const newQ = tag === "Universal" ? "" : tag;
    setQuery(newQ);
    setPage(1);
    if (tag === "Universal") {
      setFilterKey("universal");
    } else {
      fetchScripts(newQ, 1, filterKey);
    }
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Terminal className="w-4 h-4 text-red-500" />
            <span>Roblox Script Executor Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400">
            Script Roblox Copy & Paste
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Cari dan salin script Roblox terbaru untuk executor seluler maupun PC. Siap pakai tanpa ribet!
          </p>
        </div>

        {/* Search Bar & Filters */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari script (contoh: Blox Fruits, Door, Auto Farm)..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-90 active:scale-95 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cari</span>
            </button>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-gray-500 font-medium">Populer:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickTag(tag)}
                className="px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 pt-2 border-t border-gray-800/80 text-xs">
            <button
              onClick={() => { setFilterKey("all"); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filterKey === "all" 
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30" 
                  : "bg-gray-800/60 text-gray-400 hover:text-white"
              }`}
            >
              Semua Script
            </button>
            <button
              onClick={() => { setFilterKey("no-key"); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                filterKey === "no-key" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
                  : "bg-gray-800/60 text-gray-400 hover:text-white"
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Tanpa Key (No Key)</span>
            </button>
            <button
              onClick={() => { setFilterKey("universal"); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                filterKey === "universal" 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" 
                  : "bg-gray-800/60 text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm font-medium">Memuat script Roblox...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-2">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-400">Gagal Memuat Script</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchScripts(query, page, filterKey)}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-500 transition-colors mt-2"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Script Grid List */}
        {!loading && !error && (
          <>
            {scripts.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/40 border border-gray-800/80 rounded-2xl">
                <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-300">Script Tidak Ditemukan</h3>
                <p className="text-xs text-gray-500 mt-1">Coba kata kunci lain atau pilih tag populer di atas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg hover:shadow-2xl transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Game Info */}
                      <div className="flex items-start gap-3">
                        {item.gameImage ? (
                          <img
                            src={item.gameImage}
                            alt={item.gameName}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-6 h-6 text-red-400" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                <ShieldCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                            {item.key ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                                <Lock className="w-3 h-3" /> Has Key
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                <Unlock className="w-3 h-3" /> No Key
                              </span>
                            )}
                            {item.isUniversal && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                                Universal
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-gray-100 group-hover:text-red-400 transition-colors line-clamp-1 mt-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">
                            {item.gameName}
                          </p>
                        </div>
                      </div>

                      {/* Code Block */}
                      <div className="relative bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-24 select-all">
                        <code>{item.script}</code>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(item.id, item.script)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        copiedId === item.id
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-90 text-white shadow-lg shadow-red-600/20"
                      }`}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Berhasil Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 disabled:opacity-40 text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-gray-400 font-mono">
                  Halaman <strong className="text-white">{page}</strong> dari <strong className="text-white">{totalPages}</strong>
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 disabled:opacity-40 text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
