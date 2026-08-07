"use client";

import { useMemo, useState } from "react";

const ALLOW = ["xnxx.com", "xvideos.com", "xnxx.tv"];

function hostOk(url: string) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return ALLOW.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
}

export default function NsfwWatchPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState("");
  const [err, setErr] = useState("");

  const embedSrc = useMemo(() => {
    if (!active) return "";
    // Banyak situs dewasa memblokir iframe. Fallback: buka di tab / window dalam page via link resmi.
    return active;
  }, [active]);

  const wrap = {
    background: "#0B0710",
    minHeight: "100vh",
    color: "#F3EEFA",
    fontFamily: "sans-serif",
    padding: 20,
  } as const;

  const input = {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1C1226",
    color: "#F3EEFA",
  } as const;

  const btn = {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#A855F7",
    color: "#fff",
    fontWeight: 700,
  } as const;

  if (!unlocked) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 400, margin: "40px auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>18+ Watch</h1>
          <p style={{ fontSize: 12, color: "#9C90AC", margin: "8px 0 16px" }}>
            Hanya menonton lewat link resmi. Masukkan kode akses.
          </p>
          <input
            type="password"
            style={input}
            placeholder="Kode (default: toolweb18)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="button"
            style={btn}
            onClick={() => {
              if (code.trim() === "toolweb18" || code.trim().length > 0) {
                setUnlocked(true);
                setErr("");
              } else setErr("Isi kode");
            }}
          >
            Lanjut
          </button>
          {err && (
            <p style={{ color: "#F87171", fontSize: 12, marginTop: 10 }}>{err}</p>
          )}
        </div>
      </div>
    );
  }

  const openWatch = () => {
    setErr("");
    const u = url.trim();
    if (!u) {
      setErr("Tempel link dulu");
      return;
    }
    if (!hostOk(u)) {
      setErr("Hanya link xnxx.com / xvideos.com / xnxx.tv");
      return;
    }
    setActive(u);
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>NSFW Watch</h1>
        <p style={{ fontSize: 12, color: "#9C90AC", margin: "6px 0 14px" }}>
          Tempel link dari situs resmi → putar di sini. Tidak mendownload file.
        </p>

        <input
          style={input}
          placeholder="https://www.xnxx.com/video-..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="button" style={btn} onClick={openWatch}>
          Putar
        </button>
        {err && (
          <p style={{ color: "#F87171", fontSize: 13, marginTop: 10 }}>{err}</p>
        )}

        {active && (
          <div style={{ marginTop: 16 }}>
            {/* Banyak situs blok iframe: sediakan 2 cara */}
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#000",
                minHeight: 280,
              }}
            >
              <iframe
                src={embedSrc}
                title="player"
                style={{ width: "100%", height: 360, border: "none" }}
                allow="fullscreen; autoplay"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>

            <p style={{ fontSize: 12, color: "#9C90AC", marginTop: 12 }}>
              Jika layar kosong (situs memblokir iframe), buka langsung di tab:
            </p>
            <a
              href={active}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...btn,
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                background: "#374151",
                marginTop: 8,
              }}
            >
              Buka di situs resmi
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
