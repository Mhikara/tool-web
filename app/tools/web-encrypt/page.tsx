"use client";
import { useState } from "react";

function escapeForString(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/<\/script/gi, "<\\/script");
}

function toBase64Unicode(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

function encryptHtml(source: string, level: "light" | "medium" | "heavy") {
  const clean = source.trim();
  if (!clean) return "";

  if (level === "light") {
    // Encode karakter jadi HTML entities (sebagian)
    const encoded = clean
      .split("")
      .map((ch, i) => {
        if (i % 3 === 0 && ch.charCodeAt(0) > 31) {
          return "&#" + ch.charCodeAt(0) + ";";
        }
        return ch;
      })
      .join("");
    return (
      "<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\"><title>Protected</title></head>\n<body>\n" +
      encoded +
      "\n<script>document.addEventListener('contextmenu',e=>e.preventDefault());</script>\n</body>\n</html>"
    );
  }

  if (level === "medium") {
    const b64 = toBase64Unicode(clean);
    return (
      "<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\"><title>Protected</title></head>\n<body>\n" +
      "<div id=\"app\"></div>\n" +
      "<script>\n" +
      "(function(){\n" +
      "  document.addEventListener('contextmenu',function(e){e.preventDefault();});\n" +
      "  document.addEventListener('keydown',function(e){\n" +
      "    if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&(e.key==='I'||e.key==='J'||e.key==='C'))||(e.ctrlKey&&e.key==='u')){e.preventDefault();}\n" +
      "  });\n" +
      "  var s=decodeURIComponent(escape(atob('" +
      b64 +
      "')));\n" +
      "  document.getElementById('app').innerHTML=s;\n" +
      "})();\n" +
      "</script>\n</body>\n</html>"
    );
  }

  // heavy: double layer + eval-like reconstruct (masih bisa di-reverse, tapi lebih ribet)
  const b64 = toBase64Unicode(clean);
  const parts: string[] = [];
  for (let i = 0; i < b64.length; i += 40) {
    parts.push(b64.slice(i, i + 40));
  }
  const arr = parts.map((p) => "'" + p + "'").join(",");

  return (
    "<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\"><title>Protected</title>\n" +
    "<style>body{margin:0;background:#0b0710;color:#eee;font-family:sans-serif}</style>\n" +
    "</head>\n<body>\n<div id=\"root\"></div>\n<script>\n" +
    "(function(){\n" +
    "  'use strict';\n" +
    "  document.addEventListener('contextmenu',function(e){e.preventDefault();});\n" +
    "  document.onkeydown=function(e){\n" +
    "    if(e.keyCode===123||(e.ctrlKey&&e.shiftKey&&(e.keyCode===73||e.keyCode===74||e.keyCode===67))||(e.ctrlKey&&e.keyCode===85)){\n" +
    "      return false;\n" +
    "    }\n" +
    "  };\n" +
    "  var p=[" +
    arr +
    "];\n" +
    "  var b=p.join('');\n" +
    "  var html=decodeURIComponent(escape(atob(b)));\n" +
    "  document.getElementById('root').innerHTML=html;\n" +
    "})();\n" +
    "</script>\n</body>\n</html>"
  );
}

export default function WebEncryptPage() {
  const [source, setSource] = useState(
    "<h1>Halo</h1>\n<p>Ini konten yang akan dilindungi.</p>"
  );
  const [level, setLevel] = useState<"light" | "medium" | "heavy">("medium");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  const run = () => {
    if (!source.trim()) {
      setStatus("Tempel HTML dulu.");
      return;
    }
    const result = encryptHtml(source, level);
    setOutput(result);
    setStatus("Selesai dienkripsi (" + level + ").");
  };

  const copyOut = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setStatus("Tersalin ke clipboard.");
    } catch {
      setStatus("Gagal copy — select manual saja.");
    }
  };

  const downloadOut = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "protected.html";
    a.click();
    setStatus("File protected.html diunduh.");
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1C1226",
    color: "#F3EEFA",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 1.45,
  } as const;

  const btn = {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#A855F7",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
  } as const;

  const tab = (active: boolean) =>
    ({
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.1)",
      background: active ? "#A855F7" : "transparent",
      color: active ? "#fff" : "#9C90AC",
      fontWeight: 600,
      fontSize: 12,
    }) as const;

  return (
    <div
      style={{
        background: "#0B0710",
        minHeight: "100vh",
        color: "#F3EEFA",
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🔒 Web Encryption</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 16 }}>
          Enkripsi / obfuscate source HTML di browser. Bukan anti-hack absolut —
          hanya menyulitkan View Source.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button type="button" style={tab(level === "light")} onClick={() => setLevel("light")}>
            Light
          </button>
          <button type="button" style={tab(level === "medium")} onClick={() => setLevel("medium")}>
            Medium
          </button>
          <button type="button" style={tab(level === "heavy")} onClick={() => setLevel("heavy")}>
            Heavy
          </button>
        </div>

        <label style={{ fontSize: 12, color: "#9C90AC" }}>HTML sumber</label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={8}
          style={{ ...inputStyle, marginTop: 6, marginBottom: 12, resize: "vertical" }}
          placeholder="Tempel HTML di sini..."
        />

        <button type="button" onClick={run} style={{ ...btn, width: "100%", marginBottom: 12 }}>
          Enkripsi Sekarang
        </button>

        {status && (
          <p style={{ fontSize: 13, color: "#9C90AC", marginBottom: 10 }}>{status}</p>
        )}

        {output && (
          <>
            <label style={{ fontSize: 12, color: "#9C90AC" }}>Hasil protected HTML</label>
            <textarea
              readOnly
              value={output}
              rows={10}
              style={{ ...inputStyle, marginTop: 6, marginBottom: 12, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={copyOut} style={{ ...btn, background: "#374151" }}>
                Copy
              </button>
              <button type="button" onClick={downloadOut} style={btn}>
                Download .html
              </button>
            </div>
          </>
        )}

        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 20, lineHeight: 1.5 }}>
          Catatan: siapa pun yang paham DevTools tetap bisa membaca hasil decode.
          Cocok untuk menyembunyikan konten dari View Source biasa, bukan proteksi
          keamanan serius.
        </p>
      </div>
    </div>
  );
}
