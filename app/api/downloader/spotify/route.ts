const [spotifyUnavailable, setSpotifyUnavailable] = useState(false);

const handleSpotifySearch = async () => {
  setLoading(true);
  setStatus("Mencari...");
  setTracks([]);
  setSpotifyUnavailable(false);
  try {
    const res = await fetch("/api/downloader/spotify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input }),
    });
    const data = await res.json();
    if (data.unavailable) {
      setSpotifyUnavailable(true);
      setStatus("");
{spotifyUnavailable && (
  <div style={{
    marginTop: 16,
    padding: 16,
    background: "rgba(168,85,247,0.1)",
    border: "1px solid rgba(168,85,247,0.3)",
    borderRadius: 12,
    fontSize: 13,
    color: "#C4B5FD",
  }}>
    🔧 Fitur pencarian Spotify sedang belum aktif — Spotify sementara menahan
    pembuatan akses developer baru. Fitur lain (YouTube, TikTok, Instagram) tetap bisa dipakai normal.
  </div>
)}
      return;
    }
    if (!res.ok) throw new Error(data.error);
    setTracks(data.tracks || []);
    setStatus(data.tracks?.length ? "" : "Tidak ada hasil.");
  } catch (e: any) {
    setStatus(e.message || "Gagal mencari.");
  } finally {
    setLoading(false);
  }
};
