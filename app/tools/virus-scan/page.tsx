"use client";
import { useState } from "react";

export default function VirusScanPage() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const scan = async () => {
    if (!target.trim()) {
      setError("Isi URL, domain, atau IP dulu.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tools/virus-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal scan");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🛡️ Virus Scan</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>
          Scan URL, domain, atau IP lewat database publik (gratis).
        </p>

        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="https://contoh.com atau 1.2.3.4"
          style={{
            width: "100%", padding: 12, marginBottom: 12, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)", background: "#1C1226", color: "#F3EEFA",
          }}
        />
        <button
          type="button"
          disabled={loading}
          onClick={scan}
          style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: "#A855F7", color: "#fff", fontWeight: 700,
          }}
        >
          {loading ? "Memindai..." : "Scan Sekarang"}
        </button>

        {error && <p style={{ marginTop: 12, color: "#F87171", fontSize: 13 }}>{error}</p>}

        {result && (
          <div style={{
            marginTop: 20, background: "#1C1226", borderRadius: 14, padding: 16,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              fontSize: 16, fontWeight: 700, marginBottom: 8,
              color: result.malicious ? "#F87171" : "#34D399",
            }}>
              {result.verdict}
            </div>
            <div style={{ fontSize: 12, color: "#9C90AC", marginBottom: 10 }}>{result.url}</div>
            {result.siteInfo && (
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div>Reachable: {result.siteInfo.reachable ? "Ya" : "Tidak"}</div>
                {result.siteInfo.status != null && <div>HTTP: {result.siteInfo.status}</div>}
                {result.siteInfo.server && <div>Server: {result.siteInfo.server}</div>}
              </div>
            )}
            {result.urlhaus && (
              <div style={{ fontSize: 12, marginTop: 10, color: "#C4B5FD" }}>
                URLhaus: {result.urlhaus.status}
                {result.urlhaus.threat ? " · " + result.urlhaus.threat : ""}
              </div>
            )}
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 12 }}>{result.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
