import Link from "next/link";
import { makerTools } from "@/lib/makerTools";

export default function MakerHub() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>✨ Maker</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Pilih tool untuk mulai generate.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {makerTools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/maker/${tool.slug}`}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 12,
              border: "1px solid #eee",
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{tool.title}</div>
            <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{tool.description}</div>
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 10,
                fontWeight: 700,
                color: "#7C3AED",
                background: "#F3E8FF",
                padding: "2px 8px",
                borderRadius: 100,
              }}
            >
              {tool.tag}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
