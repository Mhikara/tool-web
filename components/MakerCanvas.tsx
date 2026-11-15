"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const MAKERS: Record<string, { title: string; description: string }> = {
  "qr-code-maker": {
    title: "QR Code Maker",
    description: "Buat QR Code untuk URL, WhatsApp, Wi-Fi, dan teks.",
  },
  "thumbnail-maker": {
    title: "Thumbnail Maker",
    description: "Buat thumbnail video dengan foto dan tulisan.",
  },
  "meme-maker": {
    title: "Meme Maker",
    description: "Buat meme dengan gambar dan teks atas/bawah.",
  },
  "sticker-maker": {
    title: "Sticker Maker",
    description: "Buat stiker teks dan gambar dengan latar transparan.",
  },
  "logo-maker": {
    title: "Logo Maker",
    description: "Buat logo sederhana untuk brand atau toko.",
  },
  "social-media-maker": {
    title: "Social Media Maker",
    description: "Buat desain Feed dan Story media sosial.",
  },
};

export default function MakerCanvas({ slug }: { slug: string }) {
  const tool = MAKERS[slug];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [text, setText] = useState("DESAIN KEREN");
  const [subtitle, setSubtitle] = useState("Buat sesuatu yang menarik");
  const [content, setContent] = useState("https://example.com");
  const [qrType, setQrType] = useState("url");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [background, setBackground] = useState("#17152b");
  const [foreground, setForeground] = useState("#ffffff");
  const [imageUrl, setImageUrl] = useState("");
  const [shape, setShape] = useState("circle");
  const [format, setFormat] = useState("feed");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const isQR = slug === "qr-code-maker";
  const isMeme = slug === "meme-maker";
  const isSticker = slug === "sticker-maker";
  const isLogo = slug === "logo-maker";
  const isSocial = slug === "social-media-maker";

  const width = isQR || isLogo ? 600 : 600;
  const height = isSocial && format === "story" ? 1067 : 600;

  useEffect(() => {
    if (!tool) return;

    let cancelled = false;

    const render = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (isQR) {
        let qrText = content.trim();

        if (qrType === "whatsapp") {
          qrText = `https://wa.me/${content.replace(/\D/g, "")}`;
        } else if (qrType === "wifi") {
          qrText = `WIFI:T:WPA;S:${ssid};P:${password};;`;
        }

        try {
          const qr = await QRCode.toDataURL(qrText || " ", {
            width: 420,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
          });

          if (cancelled) return;

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);

          const qrImage = new Image();
          qrImage.onload = () => {
            if (cancelled) return;
            ctx.drawImage(qrImage, 90, 70, 420, 420);
            ctx.fillStyle = "#111111";
            ctx.font = "bold 24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(text || "Scan Me", 300, 550);
            setReady(true);
          };
          qrImage.src = qr;
        } catch {
          setError("Gagal membuat QR Code. Periksa isi datanya.");
          setReady(false);
        }
        return;
      }

      setError("");
      ctx.fillStyle = isSticker ? "rgba(0,0,0,0)" : background;
      ctx.fillRect(0, 0, width, height);

      if (isLogo) {
        ctx.fillStyle = foreground;
        ctx.beginPath();
        ctx.arc(300, 225, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = background;
        ctx.font = "bold 100px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", 300, 225);
        ctx.fillStyle = foreground;
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(text, 300, 410);
        ctx.font = "20px sans-serif";
        ctx.fillText(subtitle, 300, 455);
      } else {
        if (imageUrl && imageRef.current) {
          const img = imageRef.current;
          const scale = Math.max(width / img.width, height / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          ctx.save();
          if (isSticker) {
            ctx.drawImage(img, 100, 70, 400, 400);
          } else {
            ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);
          }
          ctx.restore();
        }

        if (!isSticker) {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = foreground;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = isMeme ? 5 : 3;

        if (isMeme) {
          ctx.font = "bold 42px Impact, sans-serif";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#000000";
          ctx.strokeText(text.toUpperCase(), 300, 65, 550);
          ctx.fillText(text.toUpperCase(), 300, 65, 550);
          ctx.strokeText(subtitle.toUpperCase(), 300, 535, 550);
          ctx.fillText(subtitle.toUpperCase(), 300, 535, 550);
        } else if (isSticker) {
          ctx.font = "bold 42px sans-serif";
          ctx.strokeStyle = background;
          ctx.lineWidth = 10;
          ctx.strokeText(text, 300, 535, 550);
          ctx.fillText(text, 300, 535, 550);
        } else {
          ctx.font = "bold 48px sans-serif";
          ctx.fillText(text, 300, height * 0.55, 550);
          ctx.font = "22px sans-serif";
          ctx.fillText(subtitle, 300, height * 0.65, 550);
        }
      }

      ctx.shadowBlur = 0;
      setReady(true);
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [
    tool, slug, text, subtitle, content, qrType, ssid, password,
    background, foreground, imageUrl, shape, format, width, height,
    isQR, isMeme, isSticker, isLogo, isSocial,
  ]);

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar yang valid.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 10 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageRef.current = img;
      setImageUrl(url);
      setError("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Gagal membaca gambar.");
    };
    img.src = url;
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const link = document.createElement("a");
    link.download = `${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!tool) {
    return <main style={{ padding: 30, color: "white" }}>Maker tidak ditemukan.</main>;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    background: "#181522",
    color: "white",
    border: "1px solid #393248",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 7,
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <main style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: 20,
      color: "#ffffff",
      fontFamily: "sans-serif",
    }}>
      <a href="/maker" style={{ color: "#c4b5fd", textDecoration: "none" }}>
        ← Kembali ke Maker
      </a>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 20 }}>
        {tool.title}
      </h1>
      <p style={{ color: "#a1a1aa", marginTop: 5, marginBottom: 22 }}>
        {tool.description}
      </p>

      <section style={{
        display: "grid",
        gap: 15,
        padding: 16,
        borderRadius: 16,
        background: "#100d19",
        border: "1px solid #30263e",
      }}>
        {isQR ? (
          <>
            <div>
              <label style={labelStyle}>Jenis QR Code</label>
              <select style={inputStyle} value={qrType} onChange={(e) => setQrType(e.target.value)}>
                <option value="url">Website / URL</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="wifi">Wi-Fi</option>
                <option value="text">Teks biasa</option>
              </select>
            </div>
            {qrType === "wifi" ? (
              <>
                <div>
                  <label style={labelStyle}>Nama Wi-Fi (SSID)</label>
                  <input style={inputStyle} value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Nama Wi-Fi" />
                </div>
                <div>
                  <label style={labelStyle}>Password Wi-Fi</label>
                  <input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password Wi-Fi" />
                </div>
              </>
            ) : (
              <div>
                <label style={labelStyle}>{qrType === "whatsapp" ? "Nomor WhatsApp" : "Isi QR Code"}</label>
                <input style={inputStyle} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Masukkan isi QR Code" />
              </div>
            )}
            <div>
              <label style={labelStyle}>Teks di bawah QR</label>
              <input style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            {!isLogo && (
              <div>
                <label style={labelStyle}>Upload gambar (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                  style={{ ...inputStyle, padding: 9 }}
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(imageUrl);
                      setImageUrl("");
                      imageRef.current = null;
                    }}
                    style={{ marginTop: 8, color: "#fca5a5", fontSize: 12 }}
                  >
                    Hapus gambar
                  </button>
                )}
              </div>
            )}
            <div>
              <label style={labelStyle}>{isMeme ? "Teks atas" : "Teks utama"}</label>
              <input style={inputStyle} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>{isMeme ? "Teks bawah" : "Subjudul"}</label>
              <input style={inputStyle} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            {isSocial && (
              <div>
                <label style={labelStyle}>Ukuran desain</label>
                <select style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="feed">Feed persegi</option>
                  <option value="story">Story vertikal</option>
                </select>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Warna latar</label>
                <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ width: "100%", height: 42 }} />
              </div>
              <div>
                <label style={labelStyle}>Warna teks</label>
                <input type="color" value={foreground} onChange={(e) => setForeground(e.target.value)} style={{ width: "100%", height: 42 }} />
              </div>
            </div>
          </>
        )}
      </section>

      {error && (
        <p style={{ color: "#fca5a5", marginTop: 12, fontSize: 13 }}>{error}</p>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>
        Preview desain
      </h2>

      <div style={{
        padding: 10,
        borderRadius: 14,
        background: "#181522",
        border: "1px solid #393248",
      }}>
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            borderRadius: 8,
            background: "#ffffff",
          }}
        />
      </div>

      <button
        type="button"
        onClick={download}
        disabled={!ready}
        style={{
          width: "100%",
          marginTop: 16,
          padding: 14,
          borderRadius: 12,
          background: ready ? "#7c3aed" : "#4b4655",
          color: "#ffffff",
          fontWeight: 700,
          border: 0,
          cursor: ready ? "pointer" : "not-allowed",
        }}
      >
        {ready ? "⬇ Download PNG" : "Menyiapkan preview..."}
      </button>

      <p style={{ color: "#71717a", fontSize: 11, marginTop: 12, textAlign: "center" }}>
        Gambar diproses langsung di perangkat. File foto tidak diunggah ke server.
      </p>
    </main>
  );
}
