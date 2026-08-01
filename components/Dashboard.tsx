"use client";
import { useState } from "react";
import Link from "next/link";
import { downloaderTools } from "@/lib/downloaderTools";
import { makerTools } from "@/lib/makerTools";

type TabKey = "all" | "downloader" | "maker" | "tools" | "vault" | "external";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "▦" },
  { key: "downloader", label: "Downloader", icon: "⬇️" },
  { key: "maker", label: "Maker", icon: "✨" },
  { key: "tools", label: "Tools", icon: "🛠️" },
  { key: "vault", label: "Vault", icon: "🗄️" },
  { key: "external", label: "External", icon: "🔗" },
];

function ToolCard({
  href,
  icon,
  title,
  desc,
  tag,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
        textDecoration: "none",
        color: "#F3EEFA",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "#9C90AC", lineHeight: 1.5, minHeight: 32 }}>{desc}</div>
      <span
        style={{
          display: "inline-block",
          marginTop: 10,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.03em",
          color: "#C4B5FD",
          background: "rgba(168,85,247,0.15)",
          padding: "3px 10px",
          borderRadius: 100,
        }}
      >
        {tag}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<TabKey>("all");

  const showDownloader = tab === "all" || tab === "downloader";
  const showMaker = tab === "all" || tab === "maker";
  const showEmpty = tab === "tools" || tab === "vault" || tab === "external";

  return (
    <div style={{ background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 14px" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg,#A855F7,#7C3AED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🧩
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Tool Web</div>
          <div style={{ fontSize: 11, color: "#9C90AC" }}>All Tools Hub</div>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#1C1226",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          👤
        </div>
      </header>

      {/* PROFILE BANNER */}
      <div
        style={{
          margin: "4px 20px 18px",
          background: "linear-gradient(120deg,#C026D3,#A855F7 55%,#F0ABFC)",
          borderRadius: 20,
          padding: "18px 18px 16px",
          color: "#1A0B24",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>Pengguna</div>
            <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 16 }}>Selamat datang</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.45)",
              padding: "5px 11px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
            ONLINE
          </div>
        </div>
      </div>

      {/* SEARCH (visual only) */}
      <div
        style={{
          margin: "0 20px 16px",
          background: "#1C1226",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "13px 16px",
          color: "#6B6178",
          fontSize: 14,
        }}
      >
        🔍 Cari fitur, alat, atau layanan...
      </div>

      {/* TAB NAV */}
      <div style={{ position: "relative", marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            gap: 9,
            padding: "0 20px",
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flexShrink: 0,
                padding: "9px 16px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: "1px solid rgba(255,255,255,0.08)",
                background: tab === t.key ? "#A855F7" : "transparent",
                color: tab === t.key ? "#fff" : "#9C90AC",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        {showDownloader && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⬇️ Downloader</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {downloaderTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  href={`/downloader/${tool.slug}`}
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.description}
                  tag={tool.tag}
                />
              ))}
            </div>
          </section>
        )}

        {showMaker && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>✨ Maker</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {makerTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  href={`/maker/${tool.slug}`}
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.description}
                  tag={tool.tag}
                />
              ))}
            </div>
          </section>
        )}

        {showEmpty && (
          <section style={{ textAlign: "center", padding: "60px 20px", color: "#6B6178" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 14 }}>Segera hadir</div>
          </section>
        )}

        {(tab === "all" || tab === "downloader") && (
          <section
            style={{
              background: "#1C1226",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>↺ History Download</span>
              <span style={{ fontSize: 12, color: "#6B6178" }}>0</span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 16,
                fontSize: 12.5,
                color: "#9C90AC",
                textAlign: "center",
              }}
            >
              Belum ada riwayat. Download akan muncul di sini.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
