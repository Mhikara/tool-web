"use client";
import { useEffect, useRef, useState } from "react";
import { MakerTool } from "@/lib/makerTools";

export default function MakerCanvas({ tool }: { tool: MakerTool }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(tool.fields.map((f) => [f.name, f.default || ""]))
  );

  const WIDTH = 600;
  const HEIGHT = 315;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    tool.draw(ctx, WIDTH, HEIGHT, values);
  }, [tool, values]);

  const handleChange = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${tool.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {tool.icon} {tool.title}
      </h1>
      <p style={{ color: "#666", marginBottom: 20 }}>{tool.description}</p>

      <div style={{ marginBottom: 20 }}>
        {tool.fields.map((field) => (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#444" }}>
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            ) : (
              <input
                type="text"
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            )}
          </div>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto", borderRadius: 12, border: "1px solid #eee" }}
      />

      <button
        onClick={handleDownload}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 12,
          background: "#7C3AED",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        Download Gambar
      </button>
    </div>
  );
}
