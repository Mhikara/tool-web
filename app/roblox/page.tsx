"use client";

import { useState } from "react";

export default function RobloxScriptFinder() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setError("");
    setData([]);

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
    setTimeout(() => setCopiedIndex(null), 2000); // Reset tulisan copy setelah 2 detik
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">Roblox SC Finder</h1>
        <p className="text-center text-gray-400 mb-8">Cari Script No Key & Anti-Patched secara Real-Time</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
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
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Mencari..." : "Cari"}
          </button>
        </form>

        {error && <div className="text-red-400 text-center mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-100">{item.title}</h2>
                  <p className="text-sm text-blue-400 font-medium">Game: {item.game}</p>
                </div>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">
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
