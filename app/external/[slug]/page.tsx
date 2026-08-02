"use client";
import { useState, use } from "react";
import Link from "next/link";
import { getExternalBySlug } from "@/lib/externalTools";
import { notFound } from "next/navigation";

export default function ExternalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tool = getExternalBySlug(slug);
  if (!tool) return notFound();

  const wrap = { background: "#0B0710", minHeight: "100vh", color: "#F3EEFA", fontFamily: "sans-serif", padding: 24 };
  const inputStyle = {
    width: "100%", padding: 12, marginBottom: 12, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", background: "#1C1226", color: "#F3EEFA",
  } as const;
  const btnStyle = {
    width: "100%", padding: 12, borderRadius: 10, border: "none",
    background: "#A855F7", color: "#fff", fontWeight: 700,
  } as const;

  // ---- Get Code HTML ----
  const [htmlUrl, setHtmlUrl] = useState("");
  const [htmlSource, setHtmlSource] = useState("");
  const [htmlStatus, setHtmlStatus] = useState("");
  const [htmlLoading, setHtmlLoading] = useState(false);

  const handleGetHtml = async () => {
    setHtmlLoading(true); setHtmlStatus("Mengambil..."); setHtmlSource("");
    try {
      const res = await fetch("/api/external/html-fetch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: htmlUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtmlSource(data.html);
      setHtmlStatus("");
    } catch (e: any) { setHtmlStatus(e.message || "Gagal mengambil."); }
    finally { setHtmlLoading(false); }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlSource);
    setHtmlStatus("Disalin ke clipboard.");
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlSource], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "source.html";
    link.click();
  };

  // ---- Web Encryption ----
  const [rawHtml, setRawHtml] = useState("");
  const [encryptedHtml, setEncryptedHtml] = useState("");

  const handleEncrypt = () => {
    const encoded = Buffer.from(rawHtml, "utf-8").toString("base64");
    const wrapper = `<script>document.write(atob("${encoded}"))</script>`;
    setEncryptedHtml(wrapper);
  };

  const handleCopyEncrypted = () => {
    navigator.clipboard.writeText(encryptedHtml);
  };

  // ---- Foto To Link ----
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadStatus("Mengupload..."); setUploadedUrl("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/external/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadedUrl(data.url);
      setUploadStatus("Berhasil diupload.");
    } catch (err: any) {
      setUploadStatus(err.message || "Gagal upload.");
    } finally {
      setUploading(false);
    }
  };

  // ---- Nexus AI (chat pakai endpoint AI Maker yang sudah ada) ----
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiChat = async () => {
    setAiLoading(true); setAiResult("");
    try {
      const res = await fetch("/api/ai-maker", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || data?.error || "Tidak ada respons.";
      setAiResult(text);
    } catch {
      setAiResult("Terjadi kesalahan.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{tool.icon} {tool.title}</h1>
        <p style={{ color: "#9C90AC", fontSize: 13, marginBottom: 20 }}>{tool.description}</p>

        {slug === "upload-tiktok-hd" && (
          <div>
            <p style={{ fontSize: 13, color: "#9C90AC", marginBottom: 16, lineHeight: 1.6 }}>
              Fitur ini menggunakan TikTok Studio yang sudah terhubung ke akun TikTok kamu.
            </p>
            <Link href="/tiktok-studio" style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>
              Buka TikTok Studio
            </Link>
          </div>
        )}

        {slug === "get-code-html" && (
          <div>
            <input type="text" placeholder="https://contoh.com" value={htmlUrl} onChange={(e) => setHtmlUrl(e.target.value)} style={inputStyle} />
            <button disabled={htmlLoading} onClick={handleGetHtml} style={btnStyle}>Ambil Source Code</button>
            {htmlStatus && <p style={{ marginTop: 12, fontSize: 13, color: "#9C90AC" }}>{htmlStatus}</p>}
            {htmlSource && (
              <>
                <textarea readOnly value={htmlSource} rows={12} style={{ ...inputStyle, marginTop: 16, fontFamily: "monospace", fontSize: 11 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleCopyHtml} style={{ ...btnStyle, background: "#374151" }}>Copy</button>
                  <button onClick={handleDownloadHtml} style={btnStyle}>Download .html</button>
                </div>
              </>
            )}
          </div>
        )}

        {slug === "deploy-update-web" && (
          <div style={{ padding: 16, background: "#1C1226", borderRadius: 12, fontSize: 13, color: "#9C90AC", lineHeight: 1.7 }}>
            Deploy otomatis dari sini butuh <b>Vercel Deploy Hook</b> (URL rahasia dari project Vercel kamu).
            Setelah kamu buat Deploy Hook di Vercel → Settings → Git → Deploy Hooks, tempel URL-nya di
            <code style={{ background: "#0B0710", padding: "2px 6px", borderRadius: 4 }}> .env.local</code> sebagai
            <code style={{ background: "#0B0710", padding: "2px 6px", borderRadius: 4 }}> VERCEL_DEPLOY_HOOK_URL</code>,
            lalu beri tahu saya untuk saya buatkan tombol trigger redeploy-nya.
          </div>
        )}

        {slug === "nexus-ai" && (
          <div>
            <textarea placeholder="Tanya apa saja..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} style={inputStyle} />
            <button disabled={aiLoading} onClick={handleAiChat} style={btnStyle}>{aiLoading ? "Memproses..." : "Kirim"}</button>
            {aiResult && (
              <div style={{ marginTop: 16, padding: 14, background: "#1C1226", borderRadius: 10, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {aiResult}
              </div>
            )}
          </div>
        )}

        {slug === "foto-to-link" && (
          <div>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ marginBottom: 12, color: "#9C90AC" }} />
            {uploadStatus && <p style={{ fontSize: 13, color: "#9C90AC" }}>{uploadStatus}</p>}
            {uploadedUrl && (
              <div style={{ marginTop: 12 }}>
                <img src={uploadedUrl} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />
                <input readOnly value={uploadedUrl} style={inputStyle} onFocus={(e) => e.target.select()} />
              </div>
            )}
          </div>
        )}

        {slug === "web-encryption" && (
          <div>
            <textarea placeholder="Paste kode HTML di sini..." value={rawHtml} onChange={(e) => setRawHtml(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} />
            <button onClick={handleEncrypt} style={btnStyle}>Encrypt</button>
            {encryptedHtml && (
              <>
                <textarea readOnly value={encryptedHtml} rows={6} style={{ ...inputStyle, marginTop: 16, fontFamily: "monospace", fontSize: 11 }} />
                <button onClick={handleCopyEncrypted} style={{ ...btnStyle, background: "#374151" }}>Copy Hasil</button>
                <p style={{ fontSize: 11, color: "#6B6178", marginTop: 8 }}>
                  Catatan: ini obfuscation ringan (base64), bukan enkripsi kriptografis — mencegah HTML terbaca sekilas,
                  bukan proteksi keamanan penuh.
                </p>
              </>
            )}
          </div>
        )}

        {slug === "unban-whatsapp" && (
          <div style={{ fontSize: 13, color: "#9C90AC", lineHeight: 1.8 }}>
            <p style={{ marginBottom: 12 }}>Kalau nomor WhatsApp kamu ter-banned, langkah resminya:</p>
            <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li>Buka aplikasi WhatsApp, akan muncul layar "Nomor Anda diblokir"</li>
              <li>Ketuk tombol untuk mengirim banding lewat email ke tim WhatsApp</li>
              <li>Jelaskan situasinya dengan sopan (misal: pakai WhatsApp Business tanpa maksud spam)</li>
              <li>Tunggu balasan, biasanya dalam beberapa hari</li>
            </ol>
            <p>Hindari pakai aplikasi WhatsApp modifikasi (GB WhatsApp dll) karena itu penyebab paling umum banned permanen dan sulit diajukan banding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
